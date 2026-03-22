import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AnalysisResultSchema, AnalysisResult } from "./schema";
import { ExtractedWebsiteData, buildSystemPrompt, buildUserPrompt } from "./prompts";

export async function evaluateWebsiteData(data: ExtractedWebsiteData): Promise<AnalysisResult> {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Fast, robust model for structured output
    maxOutputTokens: 8192,
    temperature: 0.2, // Low temperature for more deterministic analysis
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  });

  // Enforce the strict JSON schema using LangChain's structured output
  const structuredLlm = llm.withStructuredOutput(AnalysisResultSchema, { 
    name: "website_evaluation_report" 
  });

  const systemMessage = buildSystemPrompt();
  const userMessage = buildUserPrompt(data);

  try {
    console.log(`Starting AI Evaluation for: ${data.url}`);
    
    // Invoke the model with structured output
    const result = await structuredLlm.invoke([
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ]);

    console.log("Successfully generated structured evaluation.");
    return result;

  } catch (error) {
    console.error("AI Evaluation failed, falling back to safe defaults:", error);
    
    // Fallback handling to ensure the UI doesn't crash during a hackathon demo
    // if the LLM times out or returns malformed JSON that fails Zod validation.
    return getFallbackResponse(data.url);
  }
}

function getFallbackResponse(url: string): AnalysisResult {
  return {
    website_type: "Other",
    overall_score: 5.0,
    scores: {
      design: 5.0,
      ux: 5.0,
      conversion: 5.0,
      business_logic: 5.0,
      growth: 5.0,
    },
    roles: [
      {
        role: "Elderly User",
        overallScore: 5.0,
        tags: ["Accessibility", "Contrast"],
        summary: "Could not complete full analysis for this role.",
        criticalInsights: "Analysis was interrupted.",
        breakdown: [
          { category: "Readability", score: 5.0 },
          { category: "Navigation", score: 5.0 }
        ],
        problems: [],
        recommendations: ["Ensure basic accessibility standards are met."]
      },
      {
        role: "Legal Reviewer",
        overallScore: 5.0,
        tags: ["Compliance", "Trust"],
        summary: "Could not complete full analysis for this role.",
        criticalInsights: "Analysis was interrupted.",
        breakdown: [
          { category: "Policy Visibility", score: 5.0 }
        ],
        problems: [],
        recommendations: ["Ensure privacy policy is linked in the footer."]
      },
      {
        role: "Product Manager",
        overallScore: 5.0,
        tags: ["UX", "Flow"],
        summary: "Could not complete full analysis for this role.",
        criticalInsights: "Analysis was interrupted.",
        breakdown: [
          { category: "User Journey", score: 5.0 }
        ],
        problems: [],
        recommendations: ["Ensure a clear primary CTA exists."]
      },
      {
        role: "Industry Practitioner",
        overallScore: 5.0,
        tags: ["Business", "Features"],
        summary: "Could not complete full analysis for this role.",
        criticalInsights: "Analysis was interrupted.",
        breakdown: [
          { category: "Feature Completeness", score: 5.0 }
        ],
        problems: [],
        recommendations: ["Highlight unique value propositions clearly."]
      },
      {
        role: "Investor",
        overallScore: 5.0,
        tags: ["Growth", "Market"],
        summary: "Could not complete full analysis for this role.",
        criticalInsights: "Analysis was interrupted.",
        breakdown: [
          { category: "Market Readiness", score: 5.0 }
        ],
        problems: [],
        recommendations: ["Clarify monetization strategy and business model."]
      }
    ],
    summary: `We encountered an issue analyzing ${url}, but we've generated a baseline report. The website structure might have been too complex or restricted.`,
    main_problems: [
      {
        title: "Analysis Interrupted",
        impact: "Medium",
        description: "The AI evaluator could not parse the website structure cleanly or timed out.",
        suggested_fix: "Try analyzing a specific sub-page or check if the site blocks automated scraping.",
      }
    ],
    conversion_funnel_analysis: {
      detected_flow: ["Landing", "Unknown"],
      problems: ["Unable to map full conversion flow automatically."],
    },
    business_logic_analysis: {
      missing_elements: ["Could not verify trust signals", "Could not verify pricing"],
      structural_problems: ["Structural analysis was interrupted."],
    },
    growth_analysis: {
      missing_growth_features: ["Could not verify growth hooks"],
      opportunities: ["Re-run analysis to identify growth opportunities."],
    },
    quick_wins: [
      "Ensure website allows basic crawling",
      "Check page load times"
    ],
  };
}
