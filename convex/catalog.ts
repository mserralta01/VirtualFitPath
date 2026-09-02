import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireVirtualFitPathAdmin } from "./lib/auth";

const category = v.union(v.literal("GLP-1"), v.literal("Peptides"));
const variant = v.object({ sku: v.string(), strength: v.string(), price: v.number(), inventory: v.number(), lowStockAt: v.number(), active: v.boolean() });
export const list = query({ args: {}, handler: async (ctx) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.query("products").take(250); } });
export const listActive = query({ args: {}, handler: async (ctx) => { const records = await ctx.db.query("products").withIndex("by_active", (q) => q.eq("active", true)).take(250); return records.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.name.localeCompare(b.name)); } });
export const getActiveBySlug = query({ args: { slug: v.string() }, handler: async (ctx, args) => { const product = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique(); return product?.active ? product : null; } });
export const save = mutation({ args: { productId: v.optional(v.id("products")), slug: v.string(), name: v.string(), category, description: v.string(), image: v.string(), badge: v.string(), featured: v.boolean(), tags: v.array(v.string()), seoTitle: v.string(), seoDescription: v.string(), sortOrder: v.number(), active: v.boolean(), variants: v.array(variant) }, handler: async (ctx, args) => {
  await requireVirtualFitPathAdmin(ctx); const { productId, ...record } = args; const slug = record.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const clean = { ...record, slug, variants: record.variants.map((item) => ({ ...item, price: Math.max(0, item.price), inventory: Math.max(0, Math.floor(item.inventory)), lowStockAt: Math.max(0, Math.floor(item.lowStockAt)) })), updatedAt: Date.now() };
  if (!clean.name.trim() || !clean.slug || !clean.variants.length) throw new Error("Name, slug, and at least one variant are required"); const duplicate = await ctx.db.query("products").withIndex("by_slug", (q) => q.eq("slug", clean.slug)).unique(); if (duplicate && duplicate._id !== productId) throw new Error("That product slug is already in use"); if (productId) { await ctx.db.patch(productId, clean); return productId; } return ctx.db.insert("products", clean);
} });
export const updateInventory = mutation({ args: { productId: v.id("products"), sku: v.string(), inventory: v.number() }, handler: async (ctx, args) => { await requireVirtualFitPathAdmin(ctx); const product = await ctx.db.get(args.productId); if (!product) throw new Error("Product not found"); await ctx.db.patch(args.productId, { variants: product.variants.map((item) => item.sku === args.sku ? { ...item, inventory: Math.max(0, Math.floor(args.inventory)) } : item), updatedAt: Date.now() }); } });
export const toggleActive = mutation({ args: { productId: v.id("products"), active: v.boolean() }, handler: async (ctx, args) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.patch(args.productId, { active: args.active, updatedAt: Date.now() }); } });
