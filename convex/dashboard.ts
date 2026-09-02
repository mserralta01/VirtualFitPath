import { query } from "./_generated/server";
import { requireVirtualFitPathAdmin } from "./lib/auth";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireVirtualFitPathAdmin(ctx);
    const [products, orders, customers] = await Promise.all([
      ctx.db.query("products").take(250),
      ctx.db.query("orders").withIndex("by_created_at").order("desc").take(500),
      ctx.db.query("customers").take(500),
    ]);
    const paid = orders.filter((order) => ["paid", "fulfilled"].includes(order.status));
    return {
      revenue: paid.reduce((sum, order) => sum + order.total, 0),
      orders: orders.length,
      customers: customers.length,
      lowStock: products.flatMap((product) => product.variants).filter((variant) => variant.inventory <= variant.lowStockAt).length,
      recentOrders: orders.sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    };
  },
});
