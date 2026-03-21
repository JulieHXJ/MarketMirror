import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Legacy table (kept for backward compatibility if needed)
  website_audits: defineTable({
    url: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("crawling"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error_message: v.optional(v.string()),
    overall_score: v.optional(v.number()),
    screenshotId: v.optional(v.id("_storage")),
    simplifiedHtml: v.optional(v.string()),
    timestamp: v.number(),
  }),

  persona_reports: defineTable({
    auditId: v.id("website_audits"),
    persona_type: v.union(v.literal("Senior"), v.literal("Pro"), v.literal("A11y")),
    score: v.number(),
    findings: v.array(v.object({
      issue: v.string(),
      coordinates: v.object({ x: v.number(), y: v.number(), width: v.optional(v.number()), height: v.optional(v.number()) }),
      severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    })),
    summary_en: v.optional(v.string()),
    summary_de: v.optional(v.string()),
  }).index("by_auditId", ["auditId"]),

  // New Table for the AI Product Auditor MVP
  product_audits: defineTable({
    url: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("crawling"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error_message: v.optional(v.string()),
    screenshotId: v.optional(v.id("_storage")),
    timestamp: v.number(),
    
    // The structured analysis result
    analysis: v.optional(v.object({
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
        impact: v.string(), // "High" | "Medium" | "Low"
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
    }))
  }),
});
