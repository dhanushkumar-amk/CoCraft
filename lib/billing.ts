import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { FREE_MONTHLY_PROMPTS } from "@/lib/plan-limits";

// Paid prompt allowances come from Clerk plan features (checked in order), per member for team plans.
const PROMPT_FEATURES = [
  { feature: "agent_prompts_2000", perMember: 2000 },
  { feature: "agent_prompts_500", perMember: 500 },
];

// Everything is scoped to an "owner": a Clerk org id for org workspaces, or a Clerk user id for
// personal ones. Clerk prefixes its ids, so they can't collide.
export const workspaceOwnerSelect = { clerkOrgId: true, creator: { select: { clerkId: true } } } as const;

export function workspaceOwnerId(workspace: { clerkOrgId: string | null; creator: { clerkId: string } }) {
  return workspace.clerkOrgId ?? workspace.creator.clerkId;
}

export async function getWorkspaceOwnerId(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: workspaceOwnerSelect });
  return workspaceOwnerId(workspace);
}

// The owner's plan features, looked up from Dodo Payments subscription in the database,
// or falling back to Clerk Billing. This works for any owner (personal user or org).
export async function getEntitlements(ownerId: string) {
  const isOrg = ownerId.startsWith("org_");

  // 1. Check Dodo Payments subscription stored in Supabase via Prisma
  try {
    const dodoSub = await prisma.subscription.findUnique({
      where: { ownerId },
    });

    if (dodoSub && (dodoSub.status === "active" || dodoSub.status === "past_due")) {
      const plan = dodoSub.plan.toLowerCase();
      let members = 1;
      try {
        if (isOrg) {
          const clerk = await clerkClient();
          const org = await clerk.organizations.getOrganization({ organizationId: ownerId, includeMembersCount: true });
          members = org.membersCount ?? 1;
        }
      } catch {
        // fallback members = 1
      }

      let promptLimit = 500;
      if (plan === "enterprise") {
        promptLimit = 2000 * members;
      } else if (plan === "team") {
        promptLimit = 500 * members;
      }

      return {
        isPaid: true,
        promptLimit,
        unlimitedWorkspaces: true,
        publicSharing: true,
        pdfExport: true,
      };
    }
  } catch (err) {
    console.error("Error reading Dodo subscription from DB:", err);
  }

  // 2. Fall back to Clerk Billing (if used)
  const features = new Set<string>();

  try {
    const clerk = await clerkClient();
    const subscription = isOrg
      ? await clerk.billing.getOrganizationBillingSubscription(ownerId)
      : await clerk.billing.getUserBillingSubscription(ownerId);
    for (const item of subscription.subscriptionItems) {
      // past_due keeps access while Clerk retries the payment.
      if (item.status === "active" || item.status === "past_due") {
        item.plan?.features.forEach((feature) => features.add(feature.slug));
      }
    }
  } catch {
    // No subscription (or Clerk unreachable): treat as the free plan.
  }

  const paid = PROMPT_FEATURES.find(({ feature }) => features.has(feature));
  let promptLimit = FREE_MONTHLY_PROMPTS;
  if (paid) {
    const clerk = await clerkClient();
    const members = isOrg
      ? ((await clerk.organizations.getOrganization({ organizationId: ownerId, includeMembersCount: true }))
          .membersCount ?? 1)
      : 1;
    promptLimit = paid.perMember * members;
  }

  return {
    isPaid: !!paid,
    promptLimit,
    unlimitedWorkspaces: features.has("unlimited_workspaces"),
    publicSharing: features.has("public_sharing"),
    pdfExport: features.has("pdf_export"),
  };
}

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// This month's prompts against the owner's allowance.
export async function getPromptUsage(ownerId: string) {
  const [{ promptLimit, isPaid }, used] = await Promise.all([
    getEntitlements(ownerId),
    prisma.agentPrompt.count({ where: { ownerId, createdAt: { gte: startOfMonthUtc() } } }),
  ]);
  return { used, limit: promptLimit, isPaid };
}

export async function recordPrompt(ownerId: string, userId: string, workspaceId: string) {
  await prisma.agentPrompt.create({ data: { ownerId, userId, workspaceId } });
}
