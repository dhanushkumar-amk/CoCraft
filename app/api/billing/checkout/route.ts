import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { dodo, isDodoConfigured } from "@/lib/dodo";

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDodoConfigured()) {
      return NextResponse.json(
        { error: "Dodo Payments is not configured yet. Please set DODO_PAYMENTS_API_KEY in .env." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const plan = (body.plan || "pro").toLowerCase();
    const payerType = body.payerType || (orgId ? "organization" : "user");

    if (payerType === "organization" && !orgId) {
      return NextResponse.json(
        { error: "Select or create an organization in the header to upgrade a team plan." },
        { status: 400 }
      );
    }

    const ownerId = payerType === "organization" ? orgId! : userId;

    let productId = process.env.DODO_PRO_PRODUCT_ID;
    if (plan === "team") {
      productId = process.env.DODO_TEAM_PRODUCT_ID || productId;
    } else if (plan === "enterprise") {
      productId = process.env.DODO_ENTERPRISE_PRODUCT_ID || productId;
    }

    if (!productId) {
      return NextResponse.json(
        { error: `No product ID configured for plan '${plan}'. Please set DODO_${plan.toUpperCase()}_PRODUCT_ID in .env.` },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const userEmail = user.emailAddresses[0]?.emailAddress || "user@example.com";
    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || undefined;

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: userEmail,
        name: userName,
      },
      metadata: {
        ownerId,
        plan,
        payerType,
        userId,
      },
      return_url: `${origin}/dashboard?upgraded=true`,
    });

    if (!session.checkout_url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.checkout_url });
  } catch (err: unknown) {
    console.error("Dodo checkout error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
