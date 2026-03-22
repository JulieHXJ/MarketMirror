import { z } from "zod";

// Defines the allowed website types
export const WebsiteTypeSchema = z.enum([
  "SaaS",
  "Ecommerce",
  "Marketplace",
  "Booking",
  "Portfolio",
  "Content site",
  "App landing page",
  "Other",
]);

// Defines the 5 core dimensions for the scores
export const AnalysisScoresSchema = z.object({
  design: z.number().min(0).max(10).describe("Design Quality score (0-10)"),
  ux: z.number().min(0).max(10).describe("UX Clarity score (0-10)"),
  conversion: z.number().min(0).max(10).describe("Conversion Funnel score (0-10)"),
  business_logic: z.number().min(0).max(10).describe("Business Logic score (0-10)"),
  growth: z.number().min(0).max(10).describe("Growth Potential score (0-10)"),
});

// A single major problem identified by the AI
export const MainProblemSchema = z.object({
  title: z.string().describe("Short title of the problem"),
  impact: z.enum(["High", "Medium", "Low"]).describe("Impact level on the user or business"),
  description: z.string().describe("Detailed explanation of the problem"),
  suggested_fix: z.string().describe("Actionable advice to fix the problem"),
});

// Specific analysis of the conversion funnel
export const ConversionFunnelAnalysisSchema = z.object({
  detected_flow: z.array(z.string()).describe("Inferred steps of the user journey, e.g. ['Landing', 'Pricing', 'Signup']"),
  problems: z.array(z.string()).describe("Specific blockers or friction points in the conversion flow"),
});

// Specific analysis of business logic alignment
export const BusinessLogicAnalysisSchema = z.object({
  missing_elements: z.array(z.string()).describe("Important business elements that are missing (e.g. trust signals, clear pricing)"),
  structural_problems: z.array(z.string()).describe("Issues with how the page is structured to serve the business model"),
});

// Specific analysis of growth mechanics
export const GrowthAnalysisSchema = z.object({
  missing_growth_features: z.array(z.string()).describe("Missing viral loops, retention hooks, or lead capture methods"),
  opportunities: z.array(z.string()).describe("Low-hanging fruit for growth experiments"),
});

// The final unified schema expected from the LLM
export const AnalysisResultSchema = z.object({
  website_type: WebsiteTypeSchema.describe("The inferred primary business model of the website"),
  overall_score: z.number().min(0).max(10).describe("The main comprehensive score for the website out of 10"),
  scores: AnalysisScoresSchema,
  roles: z.array(z.object({
    role: z.string().describe("The name of the role evaluating the site, e.g. Elderly User, Legal Reviewer"),
    overallScore: z.number().min(0).max(10).describe("Overall score out of 10 from this role's perspective"),
    tags: z.array(z.string()).describe("2-3 short evaluation keywords/tags, e.g. 'Readability', 'Compliance Risk'"),
    summary: z.string().describe("A short one-line summary of how this role perceives the site"),
    breakdown: z.array(z.object({
      category: z.string().describe("The specific dimension being scored (e.g. Navigation Simplicity)"),
      score: z.number().min(0).max(10).describe("Score out of 10 for this specific dimension"),
    })).describe("5 specific dimensions evaluated from this role's perspective"),
    criticalInsights: z.string().describe("Deeper role-specific criticism and key concerns"),
    problems: z.array(z.object({
      title: z.string(),
      impact: z.enum(["High", "Medium", "Low"]),
      description: z.string(),
      fix: z.string(),
    })).describe("List of friction points and problems specific to this role"),
    recommendations: z.array(z.string()).describe("List of role-specific recommendations for improvement"),
  })).describe("Detailed evaluation from 5 specific roles: Elderly User, Legal Reviewer, Product Manager, Industry Practitioner, Investor"),
  summary: z.string().describe("A 1-2 sentence executive summary of the evaluation"),
  main_problems: z.array(MainProblemSchema).describe("List of 3-5 major problems found on the site (Top Risks)"),
  conversion_funnel_analysis: ConversionFunnelAnalysisSchema,
  business_logic_analysis: BusinessLogicAnalysisSchema,
  growth_analysis: GrowthAnalysisSchema,
  quick_wins: z.array(z.string()).describe("List of 3-5 immediate, actionable improvements (Quick Wins)"),
});

// Types exported for use in the rest of the application
export type WebsiteType = z.infer<typeof WebsiteTypeSchema>;
export type AnalysisScores = z.infer<typeof AnalysisScoresSchema>;
export type MainProblem = z.infer<typeof MainProblemSchema>;
export type ConversionFunnelAnalysis = z.infer<typeof ConversionFunnelAnalysisSchema>;
export type BusinessLogicAnalysis = z.infer<typeof BusinessLogicAnalysisSchema>;
export type GrowthAnalysis = z.infer<typeof GrowthAnalysisSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
