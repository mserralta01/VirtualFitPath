"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StoreLayout } from "@/components/store-shell";
export default function CustomPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = use(params); const store = useQuery(api.commerce.publicStorefront); const page = store?.pages.find((item) => item.slug === slug); return <StoreLayout><main className="managed-page"><div className="container">{page ? <article><span className="eyebrow eyebrow--blue">{page.pageType}</span><h1>{page.title}</h1>{page.content.split(/\n{2,}/).map((paragraph) => <p key={paragraph.slice(0, 80)}>{paragraph}</p>)}</article> : <article><h1>Page not found</h1><p>This page is not currently published.</p></article>}</div></main></StoreLayout>; }
