import { mutation } from "./_generated/server";
import { requireVirtualFitPathAdmin } from "./lib/auth";

const products = [
  ["bpc-157", "BPC-157", "Peptides", "A synthetic pentadecapeptide supplied as a lyophilized research compound.", "/assets/products/virtualfitpath-vial.svg", "Popular", [["VFP-BPC-10", "10mg", 59.99, 48]]],
  ["ghk-cu", "GHK-Cu", "Peptides", "A copper-binding tripeptide prepared for laboratory research workflows.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-GHK-100", "100mg", 64.99, 31]]],
  ["glow", "GLOW", "Peptides", "A multi-compound research blend offered in two total fill strengths.", "/assets/products/virtualfitpath-vial.svg", "Blend", [["VFP-GLW-50", "50mg", 99.99, 18], ["VFP-GLW-70", "70mg", 129.99, 12]]],
  ["ipamorelin", "Ipamorelin", "Peptides", "A selective growth-hormone secretagogue research peptide.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-IPA-10", "10mg", 59.99, 42]]],
  ["mots-c", "MOTS-c", "Peptides", "A mitochondrial-derived peptide available in two research strengths.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-MOT-10", "10mg", 49.99, 36], ["VFP-MOT-40", "40mg", 119.99, 14]]],
  ["nad", "NAD+", "Peptides", "A nicotinamide adenine dinucleotide research compound in three strengths.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-NAD-100", "100mg", 34.99, 56], ["VFP-NAD-500", "500mg", 89.99, 24], ["VFP-NAD-1000", "1000mg", 149.99, 10]]],
  ["retatrutide", "Retatrutide", "GLP-1", "A triple-agonist research compound offered in three strengths.", "/assets/products/virtualfitpath-vial.svg", "Bestseller", [["VFP-RET-10", "10mg", 79.99, 65], ["VFP-RET-20", "20mg", 129.99, 39], ["VFP-RET-30", "30mg", 169.99, 22]]],
  ["semaglutide", "Semaglutide", "GLP-1", "A GLP-1 receptor agonist research compound in three strengths.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-SEM-5", "5mg", 54.99, 74], ["VFP-SEM-10", "10mg", 84.99, 51], ["VFP-SEM-20", "20mg", 129.99, 27]]],
  ["sermorelin", "Sermorelin", "Peptides", "A growth-hormone-releasing hormone analog for research use.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-SER-10", "10mg", 69.99, 29]]],
  ["tb-500", "TB-500", "Peptides", "A thymosin beta-4 fragment research peptide.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-TB5-10", "10mg", 69.99, 33]]],
  ["tesamorelin", "Tesamorelin", "Peptides", "A GHRH analog supplied as a 10mg lyophilized research vial.", "/assets/products/virtualfitpath-vial.svg", "", [["VFP-TES-10", "10mg", 99.99, 21]]],
  ["tirzepatide", "Tirzepatide", "GLP-1", "A dual GIP/GLP-1 receptor agonist research compound in five strengths.", "/assets/products/virtualfitpath-vial.svg", "Five strengths", [["VFP-TIR-10", "10mg", 69.99, 61], ["VFP-TIR-20", "20mg", 109.99, 43], ["VFP-TIR-30", "30mg", 149.99, 26], ["VFP-TIR-40", "40mg", 189.99, 17], ["VFP-TIR-60", "60mg", 249.99, 8]]],
] as const;

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    await requireVirtualFitPathAdmin(ctx);
    const existing = await ctx.db.query("products").first();
    if (existing) return { seeded: false };
    const now = Date.now();
    for (const [slug, name, category, description, image, badge, variants] of products) {
      await ctx.db.insert("products", { slug, name, category, description, image, ...(badge ? { badge } : {}), featured: true, sortOrder: now, active: true, updatedAt: now, variants: variants.map(([sku, strength, price, inventory]) => ({ sku, strength, price, inventory, lowStockAt: 12, active: true })) });
    }
    await ctx.db.insert("storeSettings", { singleton: "main", storeName: "VirtualFitPath", supportPhone: "800-637-9046", legalName: "Virtual Fit Path, LLC", freeShippingThreshold: 100, minimumOrder: 100, checkoutEnabled: false, announcement: "Free U.S. shipping on qualifying $100+ research orders", updatedAt: now });
    await ctx.db.insert("discounts", { code: "LAB10", type: "percent", amount: 10, active: true, usageCount: 0, startsAt: now });
    return { seeded: true };
  },
});
