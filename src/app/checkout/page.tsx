"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, CreditCard, LockKeyhole, PackageCheck, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { StoreLayout, useCart } from "@/components/store-shell";
import { money } from "@/lib/catalog";
import { VirtualFitPathVial } from "@/components/virtualfitpath-vial";

const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function CheckoutPage() {
  const cart = useCart();
  const commerce = useQuery(api.commerce.publicStorefront); const checkoutEnabled = Boolean(commerce?.settings.checkoutEnabled && commerce?.payment.enabled);
  const createOrder = useMutation(api.orders.createDraft);
  const [discountCode, setDiscountCode] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [terms, setTerms] = useState(false);
  const [shippingMethodId, setShippingMethodId] = useState(""); const methods = commerce?.shippingMethods ?? []; const selectedShipping = methods.find((item) => String(item._id ?? "") === shippingMethodId) ?? methods[0]; const minimum = commerce?.settings.minimumOrder ?? 100; const shippingCost = selectedShipping && (!selectedShipping.freeAbove || cart.subtotal < selectedShipping.freeAbove) ? selectedShipping.price : 0;
  const canCheckout = checkoutEnabled && cart.subtotal >= minimum && cart.items.length > 0 && terms;
  const savingsMessage = useMemo(() => cart.subtotal < minimum ? `Add ${money(minimum - cart.subtotal)} to reach the order minimum.` : "Order minimum reached.", [cart.subtotal, minimum]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCheckout) return;
    setSubmitting(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const order = await createOrder({
        email: String(form.get("email")), firstName: String(form.get("firstName")), lastName: String(form.get("lastName")), phone: String(form.get("phone") || ""),
        items: cart.items.map((item) => ({ sku: item.variant.sku, quantity: item.quantity })), discountCode, shippingMethodId: String(selectedShipping?._id ?? ""),
        shippingAddress: { line1: String(form.get("line1")), line2: String(form.get("line2") || ""), city: String(form.get("city")), state: String(form.get("state")), postalCode: String(form.get("postalCode")), country: "US" },
      });
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderNumber: order.orderNumber, checkoutToken: order.checkoutToken }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Secure payment is not available yet");
      window.location.assign(payload.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkout could not be started. Your cart is still saved.");
    } finally { setSubmitting(false); }
  }

  return <StoreLayout><main className="checkout-page"><div className="checkout-hero"><div className="container"><div><span className="eyebrow eyebrow--blue">Secure checkout</span><h1>Complete your research order.</h1><p>$100 USD minimum · Free U.S. shipping · Encrypted payment</p></div><div className="checkout-steps"><span className="is-active"><b>1</b> Delivery</span><i /><span><b>2</b> Payment</span><i /><span><b>3</b> Confirmed</span></div></div></div>
    <form className="container checkout-grid" onSubmit={submit}>
      <div className="checkout-form"><section className="checkout-card"><div className="checkout-card__title"><div><span>01</span><h2>Contact</h2></div><p>Receipt and order updates</p></div><div className="field-grid"><label className="field full"><span>Email address</span><input name="email" type="email" autoComplete="email" required /></label><label className="field full"><span>Phone <em>optional</em></span><input name="phone" type="tel" autoComplete="tel" /></label></div></section>
      <section className="checkout-card"><div className="checkout-card__title"><div><span>02</span><h2>Delivery</h2></div><p>United States only</p></div><div className="field-grid"><label className="field"><span>First name</span><input name="firstName" autoComplete="given-name" required /></label><label className="field"><span>Last name</span><input name="lastName" autoComplete="family-name" required /></label><label className="field full"><span>Street address</span><input name="line1" autoComplete="address-line1" required /></label><label className="field full"><span>Apartment, suite, etc. <em>optional</em></span><input name="line2" autoComplete="address-line2" /></label><label className="field"><span>City</span><input name="city" autoComplete="address-level2" required /></label><label className="field"><span>State</span><select name="state" autoComplete="address-level1" defaultValue="" required><option value="" disabled>Select state</option>{states.map((state) => <option key={state}>{state}</option>)}</select></label><label className="field"><span>ZIP code</span><input name="postalCode" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}(-[0-9]{4})?" required /></label><label className="field"><span>Country</span><select name="country" defaultValue="US" disabled><option value="US">United States</option></select></label></div></section>
      <section className="checkout-card"><div className="checkout-card__title"><div><span>03</span><h2>Shipping method</h2></div><p>Configured in your back office</p></div><div className="shipping-options">{methods.map((method) => <label key={String(method._id ?? method.name)}><input type="radio" name="shippingMethod" checked={selectedShipping?.name === method.name} onChange={() => setShippingMethodId(String(method._id ?? ""))} /><PackageCheck /><span><strong>{method.name}</strong>{method.description} · {method.estimatedDays}</span><b>{!method.freeAbove || cart.subtotal < method.freeAbove ? money(method.price) : "FREE"}</b></label>)}</div></section>
      <label className="research-consent"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} /><span><strong>I confirm this order is for laboratory research only.</strong> I understand these products are not for human or animal consumption.</span></label>
      {!checkoutEnabled && <div className="checkout-notice" role="status">Secure payment activation is in progress. Your cart is saved, but orders cannot be submitted until payment processing is enabled.</div>}
      {notice && <div className="checkout-notice" role="alert">{notice}</div>}
      <div className="checkout-bottom"><Link href="/shop"><ArrowLeft size={17} /> Continue shopping</Link><button className="button button--primary" type="submit" disabled={!canCheckout || submitting}><LockKeyhole size={17} />{submitting ? "Starting secure payment…" : checkoutEnabled ? "Continue to secure payment" : "Secure payment coming online"}</button></div></div>
      <aside className="order-summary"><div className="order-summary__head"><span>Order summary</span><strong>{cart.count} items</strong></div><div className="order-summary__items">{cart.items.map((item) => <article key={item.variant.sku}><div><VirtualFitPathVial name={item.name} strength={item.variant.strength} /><span>{item.quantity}</span></div><div><strong>{item.name}</strong><span>{item.variant.strength} · {item.variant.sku}</span></div><strong>{money(item.variant.price * item.quantity)}</strong></article>)}</div>{!cart.items.length && <div className="summary-empty">Your cart is empty. <Link href="/shop">Browse the catalogue</Link>.</div>}<div className="discount-row"><input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="Discount code" aria-label="Discount code" /><button type="button">Apply</button></div><div className="totals"><div><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div><div><span>Shipping</span><strong>{shippingCost ? money(shippingCost) : "FREE"}</strong></div><div className="total"><span>Total before discount</span><strong>{money(cart.subtotal + shippingCost)}</strong></div></div><div className={`shipping-progress ${cart.subtotal >= minimum ? "complete" : ""}`}><div><span style={{ width: `${Math.min(100, cart.subtotal / minimum * 100)}%` }} /></div><p>{cart.subtotal >= minimum && <Check size={14} />}{savingsMessage}</p></div><div className="checkout-trust"><span><CreditCard /> Secure card payment</span><span><ShieldCheck /> Protected checkout</span></div></aside>
    </form></main></StoreLayout>;
}
