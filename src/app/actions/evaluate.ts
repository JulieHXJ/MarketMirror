"use server";

import { AnalysisResult } from "@/types/analysis";
import { scrapeWebsite } from "@/lib/scraper";
import { evaluateWebsiteData } from "@/lib/ai/evaluator";

/**
 * The main Server Action called by the frontend form.
 * It orchestrates the flow: Scrape -> Parse -> LLM -> Return UI JSON.
 */
export async function evaluateWebsite(url: string): Promise<AnalysisResult> {
  try {
    // 1. Raw website extraction (Mocked for now, but modularized)
    const extractedData = await scrapeWebsite(url);

    // 2. Prompt generation, AI response parsing, and fallback logic
    const analysis = await evaluateWebsiteData(extractedData);

    return analysis;
    
  } catch (error) {
    console.error("Critical error in evaluateWebsite action:", error);
    throw new Error("Failed to evaluate the website.");
  }
}
