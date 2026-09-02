"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ShieldCheck, TestTube2, Truck } from "lucide-react";
import { StoreLayout, useCart } from "@/components/store-shell";
import { VirtualFitPathVial } from "@/components/virtualfitpath-vial";
import { getProduct, money, type Product } from "@/lib/catalog";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const liveProduct = useQuery(api.catalog.getActiveBySlug, { slug }); const product = (liveProduct === undefined ? getProduct(slug) : liveProduct) as Product | null | undefined;
  const { add } = useCart();
  const [variantIndex, setVariantIndex] = useState(0);
  if (!product) return notFound();
  const variant = product.variants[variantIndex];
  return <StoreLayout><main className="product-page"><div className="container"><div className="breadcrumbs"><Link href="/shop">Research catalogue</Link><span>/</span><span>{product.name}</span></div><div className="product-detail"><div className="product-detail__media"><VirtualFitPathVial name={product.name} strength={variant.strength} /></div><div className="product-detail__content"><span className="eyebrow eyebrow--blue">{product.category} · Research use only</span><h1>{product.name}</h1><p>{product.description}</p><strong className="product-detail__price">{money(variant.price)}</strong><div className="variant-picker"><span>Choose strength</span><div>{product.variants.map((item, index) => <button className={index === variantIndex ? "is-active" : ""} onClick={() => setVariantIndex(index)} key={item.sku}><strong>{item.strength}</strong><span>{money(item.price)}</span></button>)}</div></div><div className="sku-line"><span>SKU {variant.sku}</span><span>{variant.inventory > 12 ? "In stock" : "Low stock"}</span></div><button className="button button--primary button--full" onClick={() => add(product, variant)}>Add {variant.strength} to cart</button><div className="product-assurances"><div><TestTube2 /><span><strong>Laboratory research</strong>Strictly not for human or animal use</span></div><div><ShieldCheck /><span><strong>Batch documentation</strong>Certificate records organized by lot</span></div><div><Truck /><span><strong>Free U.S. shipping</strong>On qualifying orders of $100+</span></div></div></div></div></div></main></StoreLayout>;
}
