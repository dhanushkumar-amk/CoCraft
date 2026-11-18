import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headerList = await headers();
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    if (webhookKey && !webhookKey.startsWith("whsec_your_")) {
      try {
        const headerObj: Record<string, string> = {};
        headerList.forEach((val, key) => {
          headerObj[key] = val;
        });
        event = dodo.webhooks.unwrap(rawBody, { headers: headerObj, key: webhookKey });
      } catch (verifyErr) {
        console.error("Webhook signature verification failed:", verifyErr);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // In development or if webhook secret is not set, parse payload directly
      event = JSON.parse(rawBody);
    }

    const eventType = event.type;
    const data = event.data || {};
    const metadata = data.metadata || {};
    const ownerId = metadata.ownerId;

    console.log(`[Dodo Webhook] Received ${eventType} for owner ${ownerId || "unknown"}`);

    if (!ownerId && data.subscription_id) {
      // If metadata is not present on event data directly, try to find existing subscription
      const existing = await prisma.subscription.findUnique({
        where: { dodoSubscriptionId: data.subscription_id },
      });
      if (existing) {
        if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "cancelled" },
          });
        } else if (eventType === "subscription.renewed" || eventType === "subscription.active") {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: "active",
              currentPeriodEnd: data.next_billing_date ? new Date(data.next_billing_date) : undefined,
            },
          });
        }
        return NextResponse.json({ received: true });
      }
    }

    if (!ownerId) {
      return NextResponse.json({ received: true, note: "No ownerId found in metadata" });
    }

    switch (eventType) {
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.plan_changed": {
        const plan = metadata.plan || "pro";
        const customerId = data.customer?.customer_id || data.customer_id || undefined;
        const periodEnd = data.next_billing_date ? new Date(data.next_billing_date) : undefined;

        await prisma.subscription.upsert({
          where: { ownerId },
          create: {
            ownerId,
            dodoSubscriptionId: data.subscription_id || undefined,
            dodoCustomerId: customerId,
            plan,
            status: "active",
            currentPeriodEnd: periodEnd,
          },
          update: {
            dodoSubscriptionId: data.subscription_id || undefined,
            dodoCustomerId: customerId,
            plan,
            status: "active",
            currentPeriodEnd: periodEnd,
          },
        });
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        await prisma.subscription.updateMany({
          where: { ownerId },
          data: { status: "cancelled" },
        });
        break;
      }

      case "subscription.past_due":
      case "subscription.failed": {
        await prisma.subscription.updateMany({
          where: { ownerId },
          data: { status: "past_due" },
        });
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Dodo webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
