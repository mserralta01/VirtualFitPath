import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireVirtualFitPathAdmin } from "./lib/auth";

export const customers = query({ args: {}, handler: async (ctx) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.query("customers").take(500); } });
export const discounts = query({ args: {}, handler: async (ctx) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.query("discounts").take(250); } });
export const batches = query({ args: {}, handler: async (ctx) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.query("batches").take(500); } });
export const settings = query({ args: {}, handler: async (ctx) => { await requireVirtualFitPathAdmin(ctx); return ctx.db.query("storeSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique(); } });

export const createDiscount = mutation({
  args: { code: v.string(), type: v.union(v.literal("percent"), v.literal("fixed")), amount: v.number() },
  handler: async (ctx, args) => {
    await requireVirtualFitPathAdmin(ctx);
    return ctx.db.insert("discounts", { code: args.code.toUpperCase(), type: args.type, amount: args.amount, active: true, usageCount: 0, startsAt: Date.now() });
  },
});

export const saveSettings = mutation({
  args: { storeName: v.string(), supportEmail: v.string(), freeShippingThreshold: v.number(), minimumOrder: v.number(), checkoutEnabled: v.boolean(), announcement: v.string() },
  handler: async (ctx, args) => {
    await requireVirtualFitPathAdmin(ctx);
    const current = await ctx.db.query("storeSettings").withIndex("by_singleton", (q) => q.eq("singleton", "main")).unique();
    if (current) return ctx.db.patch(current._id, { ...args, updatedAt: Date.now() });
    return ctx.db.insert("storeSettings", { singleton: "main", ...args, updatedAt: Date.now() });
  },
});
