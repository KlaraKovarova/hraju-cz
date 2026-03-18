import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0];
  if (!item?.current_period_end) return null;
  return new Date(item.current_period_end * 1000);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const facilityId = session.metadata?.facilityId;
        if (!facilityId) break;

        await prisma.facility.update({
          where: { id: facilityId },
          data: {
            isPremium: true,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        const facility = await prisma.facility.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (!facility) break;

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const periodEnd = getPeriodEnd(subscription);

        await prisma.facility.update({
          where: { id: facility.id },
          data: {
            isPremium: true,
            subscriptionStatus: "active",
            ...(periodEnd && { premiumExpiresAt: periodEnd }),
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const facilityId = subscription.metadata?.facilityId;
        if (!facilityId) break;

        const periodEnd = getPeriodEnd(subscription);

        await prisma.facility.update({
          where: { id: facilityId },
          data: {
            subscriptionStatus: subscription.status,
            ...(periodEnd && { premiumExpiresAt: periodEnd }),
            isPremium: subscription.status === "active" || subscription.status === "trialing",
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const facilityId = subscription.metadata?.facilityId;
        if (!facilityId) break;

        await prisma.facility.update({
          where: { id: facilityId },
          data: {
            isPremium: false,
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = getSubscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;

        const facility = await prisma.facility.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (!facility) break;

        await prisma.facility.update({
          where: { id: facility.id },
          data: { subscriptionStatus: "past_due" },
        });
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
