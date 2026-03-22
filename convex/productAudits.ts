import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProductAudit = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("product_audits", {
      url: args.url,
      status: "queued",
      timestamp: Date.now(),
    });
  },
});

export const updateProductAuditStatus = mutation({
  args: {
    id: v.id("product_audits"),
    status: v.union(
      v.literal("queued"),
      v.literal("crawling"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error_message: v.optional(v.string()),
    screenshotId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, status, error_message, screenshotId } = args;
    await ctx.db.patch(id, {
      status,
      ...(error_message !== undefined ? { error_message } : {}),
      ...(screenshotId !== undefined ? { screenshotId } : {}),
    });
  },
});

export const saveProductAnalysis = mutation({
  args: {
    id: v.id("product_audits"),
    analysis: v.object({
      website_type: v.string(),
      scores: v.object({
        design: v.number(),
        ux: v.number(),
        conversion: v.number(),
        business_logic: v.number(),
        growth: v.number(),
      }),
      summary: v.string(),
      main_problems: v.array(v.object({
        title: v.string(),
        impact: v.string(),
        description: v.string(),
        suggested_fix: v.string(),
      })),
      conversion_funnel_analysis: v.object({
        detected_flow: v.array(v.string()),
        problems: v.array(v.string()),
      }),
      business_logic_analysis: v.object({
        missing_elements: v.array(v.string()),
        structural_problems: v.array(v.string()),
      }),
      growth_analysis: v.object({
        missing_growth_features: v.array(v.string()),
        opportunities: v.array(v.string()),
      }),
      quick_wins: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      analysis: args.analysis,
    });
  },
});

export const getProductAudit = query({
  args: { id: v.id("product_audits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
