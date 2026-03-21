"use client";

import { useState } from "react";
import { ScoreCard } from "./ScoreCard";
import { DetailModal } from "./DetailModal";
import { AnalysisResult, MainProblem } from "@/types/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Rocket, Lightbulb, Target } from "lucide-react";

interface DashboardGridProps {
  analysis: AnalysisResult;
}

export function DashboardGrid({ analysis }: DashboardGridProps) {
  const [activeModal, setActiveModal] = useState<keyof typeof analysis.scores | null>(null);

  // Helper to filter problems related to a specific dimension
  // Since Gemini won't strictly categorize them, we do a basic keyword match or just show all for MVP
  const getProblemsForDimension = (dimension: string): MainProblem[] => {
    // For MVP, we might just map them loosely or show specific slices.
    // If the schema allows, we could update the prompt to categorize problems.
    // For now, we'll return all problems, but ideally you'd filter them.
    return analysis.main_problems; 
  };

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-blue-400" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-slate-200">
              {analysis.summary}
            </p>
            <div className="mt-6 flex gap-4">
              <div className="bg-white/10 px-4 py-2 rounded-md">
                <span className="text-slate-400 text-sm block">Detected Model</span>
                <span className="font-semibold text-blue-300">{analysis.website_type}</span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-md">
                <span className="text-slate-400 text-sm block">Primary Flow</span>
                <span className="font-semibold text-emerald-300">
                  {analysis.conversion_funnel_analysis.detected_flow.join(" → ")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.quick_wins.slice(0, 4).map((win, idx) => (
                <li key={idx} className="flex items-start text-sm text-blue-800">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-blue-600 shrink-0" />
                  {win}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Scores Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lightbulb className="text-amber-500" />
          Dimension Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ScoreCard
            title="Design Quality"
            score={analysis.scores.design}
            summary="Visual hierarchy, readability, spacing, and brand consistency."
            onClick={() => setActiveModal("design")}
          />
          <ScoreCard
            title="UX Clarity"
            score={analysis.scores.ux}
            summary="Friction points, navigation logic, and cognitive load."
            onClick={() => setActiveModal("ux")}
          />
          <ScoreCard
            title="Conversion Funnel"
            score={analysis.scores.conversion}
            summary="CTA visibility, value proposition clarity, and user journey."
            onClick={() => setActiveModal("conversion")}
          />
          <ScoreCard
            title="Business Logic"
            score={analysis.scores.business_logic}
            summary="Alignment with business model and missing essential elements."
            onClick={() => setActiveModal("business_logic")}
          />
          <ScoreCard
            title="Growth Potential"
            score={analysis.scores.growth}
            summary="Retention hooks, viral loops, and account creation incentives."
            onClick={() => setActiveModal("growth")}
          />
        </div>
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal ? activeModal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : ""}
        score={activeModal ? analysis.scores[activeModal] : 0}
        problems={getProblemsForDimension(activeModal || "design")}
        // For MVP we can inject specific data based on the active modal
        strengths={
          activeModal === "growth" ? analysis.growth_analysis.opportunities : 
          activeModal === "business_logic" ? analysis.business_logic_analysis.missing_elements :
          []
        }
      />
    </div>
  );
}
