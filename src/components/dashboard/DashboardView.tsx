"use client";

import { useState } from "react";
import { AnalysisResult, RoleAnalysis } from "@/types/analysis";
import { RoleCard } from "./RoleCard";
import { RoleDetailPanel } from "./RoleDetailPanel";
import { AlertTriangle, CheckCircle2, Globe, Target, Users } from "lucide-react";

interface DashboardViewProps {
  analysis: AnalysisResult;
  url?: string;
}

export function DashboardView({ analysis, url = "https://example.com" }: DashboardViewProps) {
  const [activeRole, setActiveRole] = useState<RoleAnalysis | null>(null);

  // Use the new overall_score from the backend schema, or calculate a fallback
  const overallScore = analysis.overall_score || 
    (Object.values(analysis.scores).reduce((a, b) => a + b, 0) / 5);

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700">
      {/* SECTION 1 - Overall Score Area */}
      <section className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 shadow-sm shadow-slate-100/50">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Website Intelligence Report
            </h1>
            <div className="flex items-center text-slate-500 text-sm font-medium">
              <Globe className="w-4 h-4 mr-2 text-slate-400" />
              {url}
              <span className="mx-4 text-slate-300">|</span>
              <span className="text-slate-600 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold tracking-wide">
                {analysis.website_type}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-start md:items-end">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-2">
              Comprehensive Score
            </div>
            <div className="text-5xl font-extrabold text-slate-900 tracking-tighter">
              {overallScore.toFixed(1)}
              <span className="text-xl text-slate-400 font-medium ml-1">/10</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-8">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Executive Summary
          </h2>
          <p className="text-lg text-slate-700 leading-relaxed max-w-4xl font-medium">
            {analysis.summary}
          </p>
        </div>
      </section>

      {/* SECTION 2 - Role-Based Evaluation Cards */}
      {analysis.roles && analysis.roles.length > 0 && (
        <section className="bg-slate-50 border border-slate-200/60 rounded-xl p-8 lg:p-10 shadow-inner">
          <div className="flex items-center mb-6">
            <Users className="w-4 h-4 mr-2 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
              Role-Based Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {analysis.roles.map((roleData, idx) => (
              <RoleCard
                key={idx}
                role={roleData.role}
                score={roleData.overallScore}
                tags={roleData.tags}
                summary={roleData.summary}
                onClick={() => setActiveRole(roleData)}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3 & 4 - Top Risks and Quick Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* SECTION 3 - Top Risks */}
        <section className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 shadow-sm shadow-slate-100/50">
          <div className="flex items-center mb-8">
            <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
              Top Risks
            </h2>
          </div>
          <div className="space-y-6">
            {analysis.main_problems.map((problem, idx) => (
              <div key={idx} className="flex items-start gap-5 group">
                <div className={`mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full ${
                  problem.impact === "High" ? "bg-rose-500 shadow-sm shadow-rose-200" : 
                  problem.impact === "Medium" ? "bg-amber-500 shadow-sm shadow-amber-200" : "bg-blue-500"
                }`} />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2.5">
                    <h3 className="font-bold text-slate-900 text-base">{problem.title}</h3>
                    <span className={`text-[10px] w-fit font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      problem.impact === "High" ? "text-rose-700 bg-rose-50" :
                      problem.impact === "Medium" ? "text-amber-700 bg-amber-50" :
                      "text-blue-700 bg-blue-50"
                    }`}>
                      {problem.impact} Risk
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {problem.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 - Quick Wins */}
        <section className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 shadow-sm shadow-slate-100/50">
          <div className="flex items-center mb-8">
            <Target className="w-4 h-4 mr-2 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
              Quick Wins
            </h2>
          </div>
          <ul className="space-y-3">
            {analysis.quick_wins.map((win, idx) => (
              <li key={idx} className="flex items-start group p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-default">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mr-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-slate-700 font-medium text-sm leading-relaxed pt-0.5">{win}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Slide-over Role Panel */}
      <RoleDetailPanel
        isOpen={activeRole !== null}
        onClose={() => setActiveRole(null)}
        data={activeRole}
      />
    </div>
  );
}
