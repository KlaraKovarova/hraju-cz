import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
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

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const facility = await prisma.facility.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!facility) break;

        await prisma.facility.update({
          where: { id: facility.id },
          data: { subscriptionStatus: subscription.status },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const facility = await prisma.facility.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!facility) break;

        await prisma.facility.update({
          where: { id: facility.id },
          data: {
            isPremium: false,
            subscriptionStatus: "canceled",
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof sub === "string" ? sub : sub?.id;
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
