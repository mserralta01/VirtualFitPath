"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Product, Variant } from "@/lib/catalog";
import { money } from "@/lib/catalog";
import { VirtualFitPathVial } from "@/components/virtualfitpath-vial";

export type CartItem = { slug: string; name: string; image: string; variant: Variant; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, variant?: Variant) => void;
  update: (sku: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem("virtualfitpath-cart");
        if (saved) setItems(JSON.parse(saved));
      } catch { /* Ignore invalid local cart data. */ }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("virtualfitpath-cart", JSON.stringify(items));
  }, [hydrated, items]);

  const add = useCallback((product: Product, variant = product.variants[0]) => {
    setItems((current) => {
      const found = current.find((item) => item.variant.sku === variant.sku);
      return found
        ? current.map((item) => item.variant.sku === variant.sku ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { slug: product.slug, name: product.name, image: product.image, variant, quantity: 1 }];
    });
    setDrawerOpen(true);
  }, []);

  const update = useCallback((sku: string, quantity: number) => {
    setItems((current) => current.flatMap((item) => item.variant.sku === sku ? (quantity > 0 ? [{ ...item, quantity }] : []) : [item]));
  }, []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0),
    add,
    update,
    clear: () => setItems([]),
    open: () => setDrawerOpen(true),
  }), [add, items, update]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`drawer-backdrop ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className={`cart-drawer ${drawerOpen ? "is-open" : ""}`} aria-label="Shopping cart" aria-hidden={!drawerOpen}>
        <div className="cart-drawer__header">
          <div><span className="eyebrow">Research order</span><h2>Your cart</h2></div>
          <button className="icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close cart"><X size={20} /></button>
        </div>
        <div className="cart-drawer__body">
          {!items.length ? (
            <div className="empty-cart"><ShoppingBag size={34} /><h3>Your cart is ready for research.</h3><p>Add compounds from the catalogue to begin.</p><Link href="/shop" className="button button--primary" onClick={() => setDrawerOpen(false)}>Explore catalogue</Link></div>
          ) : items.map((item) => (
            <article className="cart-line" key={item.variant.sku}>
              <VirtualFitPathVial name={item.name} strength={item.variant.strength} />
              <div><strong>{item.name}</strong><span>{item.variant.strength} · {item.variant.sku}</span><div className="quantity"><button onClick={() => update(item.variant.sku, item.quantity - 1)} aria-label={`Remove one ${item.name}`}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => update(item.variant.sku, item.quantity + 1)} aria-label={`Add one ${item.name}`}><Plus size={14} /></button></div></div>
              <strong>{money(item.variant.price * item.quantity)}</strong>
            </article>
          ))}
        </div>
        {!!items.length && <div className="cart-drawer__footer"><div><span>Subtotal</span><strong>{money(value.subtotal)}</strong></div><p>{value.subtotal >= 100 ? "Free U.S. shipping unlocked." : `${money(100 - value.subtotal)} away from the $100 minimum.`}</p><Link href="/checkout" className={`button button--primary button--full ${value.subtotal < 100 ? "is-disabled" : ""}`} onClick={() => setDrawerOpen(false)}>Secure checkout</Link></div>}
      </aside>
    </CartContext.Provider>
  );
}

export function Header() {
  const { count, open } = useCart();
  const commerce = useQuery(api.commerce.publicStorefront);
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [["Home", "/"], ["Research", "/research"], ["Lab Results", "/lab-results"], ["Shop", "/shop"], ["Track Order", "/track-order"], ["About", "/about"], ["Contact", "/contact"]];
  const customPages = commerce?.pages.filter((page) => page.showInHeader) ?? [];
  return <>
    <div className="announcement">{commerce?.settings.announcement ?? "Free U.S. shipping on qualifying $100+ research orders"}</div>
    <div className="research-strip">Research compounds · Documentation first <Link href="/official">Verify official site</Link></div>
    <header className="site-header"><div className="site-header__inner">
      <Link href="/" aria-label="VirtualFitPath home"><Image className="brand" src="/assets/brand/virtualfitpath-wordmark.svg" width={234} height={38} alt="VirtualFitPath" priority /></Link>
      <nav className={`primary-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)}>{label}</Link>)}{customPages.map((page) => <Link key={page.slug} href={`/p/${page.slug}`} onClick={() => setMobileOpen(false)}>{page.title}</Link>)}</nav>
      <div className="header-actions"><button className="icon-button mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button><button className="icon-button cart-button" onClick={open} aria-label={`Open cart with ${count} items`}><ShoppingBag size={19} /><span>{count}</span></button></div>
    </div></header>
  </>;
}

export function Footer() {
  const commerce = useQuery(api.commerce.publicStorefront); const settings = commerce?.settings; const pages = commerce?.pages.filter((page) => page.showInFooter) ?? [];
  return <footer className="site-footer">
    <div className="container footer-promises"><div><strong>Documented batches</strong><span>COAs organized by compound and lot</span></div><div><strong>U.S. shipping</strong><span>Free on qualifying $100+ orders</span></div><div><strong>Research use only</strong><span>Not for human or animal consumption</span></div></div>
    <div className="container footer-grid"><div><Image src={settings?.logoUrl || "/assets/brand/virtualfitpath-wordmark.svg"} width={234} height={38} alt={settings?.storeName || "VirtualFitPath"} /><p>{settings?.storeTagline || "Research compounds presented with clear documentation, consistent labeling, and transparent batch records."}</p>{settings?.supportPhone && <a href={`tel:${settings.supportPhone.replace(/[^0-9+]/g, "")}`}>{settings.supportPhone}</a>}</div><div><h3>Research</h3><Link href="/research">Research gateway</Link><Link href="/research-standards">Standards</Link><Link href="/shop">Catalogue</Link><Link href="/lab-results">Lab results</Link></div><div><h3>Customer care</h3><Link href="/shop">Shop</Link><Link href="/shipping">Shipping</Link><Link href="/track-order">Track order</Link><Link href="/contact">Contact</Link></div><div><h3>Company</h3><Link href="/about">About</Link><Link href="/faq">FAQ</Link>{pages.map((page) => <Link key={page.slug} href={`/p/${page.slug}`}>{page.title}</Link>)}<Link href="/privacy">Privacy</Link><Link href="/terms">Terms &amp; Conditions</Link></div></div>
    <div className="research-disclaimer"><strong>For Research Use Only.</strong> Products displayed on this website are intended strictly for laboratory research. They are not for human or animal consumption, therapeutic use, diagnostic use, or household use.</div>
    <div className="copyright">© 2026 {settings?.legalName || "Virtual Fit Path, LLC"}. All rights reserved.</div>
  </footer>;
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const commerce = useQuery(api.commerce.publicStorefront); const design = commerce?.design;
  const style = design ? { "--blue": design.primaryColor, "--cyan": design.accentColor, "--paper": design.surfaceColor, "--ink": design.textColor } as React.CSSProperties : undefined;
  return <div className="store-runtime" data-theme={design?.themeId || "clinical-grid"} style={style}><Header />{children}<Footer /></div>;
}
