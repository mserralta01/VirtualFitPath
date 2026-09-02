import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import Stripe from "stripe";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";

const bodySchema = z.object({ orderNumber: z.string().min(5), checkoutToken: z.uuid() });
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_CONVEX_URL) return NextResponse.json({ error: "Secure payment is being configured. Your cart is still saved—please try again shortly." }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Please review the checkout details." }, { status: 400 });
  const order = await new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL).query(api.orders.getCheckout, parsed.data); if (!order) return NextResponse.json({ error: "This checkout link is invalid or has expired." }, { status: 404 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({ mode: "payment", customer_email: order.customerEmail, billing_address_collection: "required", shipping_address_collection: { allowed_countries: ["US"] }, line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(order.total * 100), product_data: { name: `VirtualFitPath research order ${order.orderNumber}`, description: order.items.map((item) => `${item.quantity}× ${item.name} ${item.strength}`).join(", ").slice(0, 500) } } }], metadata: { orderNumber: order.orderNumber }, success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${siteUrl}/checkout` });
  return NextResponse.json({ url: session.url });
}
