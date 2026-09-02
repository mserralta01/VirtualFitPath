import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireVirtualFitPathAdmin as requireStoreAdmin } from "./lib/auth";

const brand = {
  storeName: "VirtualFitPath",
  legalName: "Virtual Fit Path, LLC",
  supportEmail: "",
  supportPhone: "800-637-9046",
  logoUrl: "/assets/brand/virtualfitpath-wordmark.svg",
};

const defaultDesign = {
  singleton: "main",
  themeId: "clinical-grid" as const,
  primaryColor: "#0b1f3a",
  accentColor: "#2376ff",
  surfaceColor: "#f4f7fb",
  textColor: "#101828",
  headingFont: "Manrope",
  bodyFont: "DM Sans",
};

const defaultSections = [
  { sectionId: "hero", type: "hero" as const, title: "Research compounds, labeled with clarity.", subtitle: "A focused peptide catalogue with variant-level labeling and accessible batch documentation.", enabled: true, sortOrder: 10 },
  { sectionId: "featured", type: "featured" as const, title: "Featured peptide research", subtitle: "Popular compounds and current strengths, synced directly from inventory.", enabled: true, sortOrder: 20 },
  { sectionId: "trust", type: "trust" as const, title: "Documentation-first sourcing", subtitle: "Batch records, consistent labeling, and a clear research-only purchasing flow.", enabled: true, sortOrder: 30 },
  { sectionId: "certificates", type: "certificates" as const, title: "Batch documentation built to be checked", subtitle: "Search published certificates by compound and lot before beginning research.", enabled: true, sortOrder: 40 },
];

const defaultShipping = [{
  _id: null,
  name: "Standard U.S. shipping",
  description: "Tracked delivery for research orders",
  price: 0,
  estimatedDays: "2–5 business days",
  enabled: true,
  sortOrder: 10,
  freeAbove: 100,
}];

export const publicStorefront = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const [settings, design, storedSections, pages, storedShipping, payment] = await Promise.all([
      ctx.db.query("storeSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
      ctx.db.query("storeDesign").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
      ctx.db.query("pageSections").withIndex("by_sort_order").take(30),
      ctx.db.query("pages").withIndex("by_status", (q) => q.eq("status", "published")).take(50),
      ctx.db.query("shippingMethods").withIndex("by_enabled_and_sort_order", (q) => q.eq("enabled", true)).take(10),
      ctx.db.query("paymentSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
    ]);
    return {
      settings: settings ?? { singleton: "main", ...brand, freeShippingThreshold: 100, minimumOrder: 100, checkoutEnabled: false, announcement: "Free U.S. shipping on qualifying $100+ research orders", storeTagline: "Documentation-first research supply", currency: "USD", timezone: "America/New_York" },
      design: design ?? defaultDesign,
      sections: storedSections.length ? storedSections : defaultSections,
      pages,
      shippingMethods: storedShipping.length ? storedShipping : defaultShipping,
      payment: payment ?? { singleton: "main", provider: "stripe", currency: "USD", enabled: false, statementDescriptor: "VIRTUALFITPATH", checkoutMessage: "Secure card payment" },
    };
  },
});

export const adminState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const { userId, admin } = await requireStoreAdmin(ctx);
    const [user, settings, design, sections, pages, shippingMethods, payment] = await Promise.all([
      ctx.db.get(userId),
      ctx.db.query("storeSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
      ctx.db.query("storeDesign").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
      ctx.db.query("pageSections").withIndex("by_sort_order").take(30),
      ctx.db.query("pages").take(50),
      ctx.db.query("shippingMethods").take(20),
      ctx.db.query("paymentSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(),
    ]);
    return { user, admin, settings, design: design ?? defaultDesign, sections: sections.length ? sections : defaultSections, pages, shippingMethods: shippingMethods.length ? shippingMethods.sort((a, b) => a.sortOrder - b.sortOrder) : defaultShipping, payment };
  },
});

export const saveDesign = mutation({
  args: {
    themeId: v.union(v.literal("clinical-grid"), v.literal("midnight-lab"), v.literal("molecule-editorial"), v.literal("cold-chain"), v.literal("biofuture")),
    primaryColor: v.string(), accentColor: v.string(), surfaceColor: v.string(), textColor: v.string(), headingFont: v.string(), bodyFont: v.string(),
  },
  returns: v.id("storeDesign"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const current = await ctx.db.query("storeDesign").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique();
    if (current) { await ctx.db.patch(current._id, { ...args, updatedAt: Date.now() }); return current._id; }
    return ctx.db.insert("storeDesign", { singleton: "main", ...args, updatedAt: Date.now() });
  },
});

export const saveSection = mutation({
  args: { sectionId: v.string(), type: v.union(v.literal("hero"), v.literal("featured"), v.literal("trust"), v.literal("categories"), v.literal("certificates"), v.literal("editorial"), v.literal("newsletter")), title: v.string(), subtitle: v.string(), enabled: v.boolean(), sortOrder: v.number() },
  returns: v.id("pageSections"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const current = await ctx.db.query("pageSections").withIndex("by_section_id", (q) => q.eq("sectionId", args.sectionId)).unique();
    if (current) { await ctx.db.patch(current._id, { ...args, updatedAt: Date.now() }); return current._id; }
    return ctx.db.insert("pageSections", { ...args, updatedAt: Date.now() });
  },
});

export const savePage = mutation({
  args: { slug: v.string(), title: v.string(), pageType: v.union(v.literal("custom"), v.literal("legal")), status: v.union(v.literal("draft"), v.literal("published")), content: v.string(), showInHeader: v.boolean(), showInFooter: v.boolean(), seoTitle: v.optional(v.string()), seoDescription: v.optional(v.string()) },
  returns: v.id("pages"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const slug = args.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) throw new Error("A page slug is required");
    const current = await ctx.db.query("pages").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (current) { await ctx.db.patch(current._id, { ...args, slug, updatedAt: Date.now() }); return current._id; }
    return ctx.db.insert("pages", { ...args, slug, updatedAt: Date.now() });
  },
});

export const saveStoreSettings = mutation({
  args: { storeName: v.string(), legalName: v.string(), supportEmail: v.string(), supportPhone: v.string(), storeTagline: v.string(), contactAddress: v.string(), announcement: v.string(), minimumOrder: v.number(), freeShippingThreshold: v.number(), checkoutEnabled: v.boolean(), currency: v.string(), timezone: v.string(), metaTitle: v.string(), metaDescription: v.string(), logoUrl: v.string(), darkLogoUrl: v.string(), faviconUrl: v.string() },
  returns: v.id("storeSettings"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const current = await ctx.db.query("storeSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique();
    const record = { ...args, updatedAt: Date.now() };
    if (current) { await ctx.db.patch(current._id, record); return current._id; }
    return ctx.db.insert("storeSettings", { singleton: "main", ...record });
  },
});

export const saveShippingMethod = mutation({
  args: { id: v.optional(v.id("shippingMethods")), name: v.string(), description: v.string(), price: v.number(), estimatedDays: v.string(), enabled: v.boolean(), sortOrder: v.number(), freeAbove: v.optional(v.number()) },
  returns: v.id("shippingMethods"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const { id, ...values } = args;
    const record = { ...values, price: Math.max(0, values.price), updatedAt: Date.now() };
    if (id) { await ctx.db.patch(id, record); return id; }
    return ctx.db.insert("shippingMethods", record);
  },
});

export const savePaymentSettings = mutation({
  args: { provider: v.union(v.literal("stripe"), v.literal("manual")), currency: v.string(), enabled: v.boolean(), statementDescriptor: v.string(), checkoutMessage: v.string() },
  returns: v.id("paymentSettings"),
  handler: async (ctx, args) => {
    await requireStoreAdmin(ctx);
    const current = await ctx.db.query("paymentSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique();
    if (current) { await ctx.db.patch(current._id, { ...args, updatedAt: Date.now() }); return current._id; }
    return ctx.db.insert("paymentSettings", { singleton: "main", ...args, updatedAt: Date.now() });
  },
});

export const saveAccount = mutation({
  args: { displayName: v.string(), phone: v.string(), emailNotifications: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, admin } = await requireStoreAdmin(ctx);
    await Promise.all([
      ctx.db.patch(userId, { name: args.displayName }),
      ctx.db.patch(admin._id, { displayName: args.displayName, phone: args.phone, emailNotifications: args.emailNotifications }),
    ]);
    return null;
  },
});
