"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProductCard } from "@/components/product-card";
import { StoreLayout } from "@/components/store-shell";
import { products } from "@/lib/catalog";

export default function ShopPage() {
  const liveProducts = useQuery(api.catalog.listActive); const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const catalog = liveProducts?.length ? liveProducts : products; const filtered = useMemo(() => catalog.filter((product) => (category === "All" || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())), [catalog, category, query]);
  return <StoreLayout><main className="shop-page"><div className="container"><div className="page-intro"><span className="eyebrow eyebrow--blue">{catalog.reduce((sum, item) => sum + item.variants.length, 0)} current SKUs</span><h1>Research catalogue</h1><p>{catalog.length} compounds, grouped by molecule with live strength-specific inventory and pricing.</p></div><div className="shop-toolbar"><label><span className="sr-only">Search products</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></label><div className="segmented">{["All", "GLP-1", "Peptides"].map((item) => <button className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div><div className="product-grid">{filtered.map((product) => <ProductCard product={product} key={product.slug} />)}</div></div></main></StoreLayout>;
}
