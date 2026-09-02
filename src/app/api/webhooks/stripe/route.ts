import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import Stripe from "stripe";
import { api } from "../../../../../convex/_generated/api";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.ORDER_WRITE_SECRET || !process.env.NEXT_PUBLIC_CONVEX_URL) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature"); if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event; try { event = new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }
  if (event.type === "checkout.session.completed") { const orderNumber = event.data.object.metadata?.orderNumber; if (orderNumber) await new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL).mutation(api.orders.recordPayment, { orderNumber, secret: process.env.ORDER_WRITE_SECRET }); }
  return NextResponse.json({ received: true });
}
