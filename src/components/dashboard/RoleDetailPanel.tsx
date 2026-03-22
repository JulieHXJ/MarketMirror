"use client";

import { useEffect } from "react";
import { X, AlertTriangle, Lightbulb, Target, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { RoleAnalysis } from "@/types/analysis";

interface RoleDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: RoleAnalysis | null;
}

export function RoleDetailPanel({ isOpen, onClose, data }: RoleDetailPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!data) return null;

  const isGood = data.overallScore >= 7.5;
  const isWarning = data.overallScore >= 5 && data.overallScore < 7.5;
  
  const scoreColor = isGood ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-rose-600";
  const bgIndicator = isGood ? "bg-emerald-50/50" : isWarning ? "bg-amber-50/50" : "bg-rose-50/50";
  const borderIndicator = isGood ? "border-emerald-100" : isWarning ? "border-amber-100" : "border-rose-100";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl shadow-slate-900/10 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role Perspective</h2>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{data.role}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-10 flex-1">
          
          {/* Header Score Block */}
          <div className={`${bgIndicator} border ${borderIndicator} rounded-xl p-8`}>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className={`text-6xl font-extrabold tracking-tighter leading-none ${scoreColor}`}>
                {data.overallScore.toFixed(1)}
              </span>
              <span className="text-slate-500 font-semibold">/10</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>

          {/* Breakdown Bars */}
          <div>
            <div className="flex items-center mb-6">
              <Target className="w-4 h-4 mr-2 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Dimension Breakdown
              </h4>
            </div>
            <div className="space-y-4">
              {data.breakdown.map((item, idx) => {
                const percent = (item.score / 10) * 100;
                const barColor = item.score >= 7.5 ? "bg-emerald-500" : item.score >= 5 ? "bg-amber-500" : "bg-rose-500";
                
                return (
                  <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-700">{item.category}</span>
                      <span className="text-sm font-bold text-slate-900">{item.score.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className={`${barColor} h-2 rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Critical Insights */}
          {data.criticalInsights && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-center mb-4">
                <MessageSquareWarning className="w-4 h-4 mr-2 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Critical Insights
                </h4>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium italic">
                "{data.criticalInsights}"
              </p>
            </div>
          )}

          {/* Role Problems */}
          <div>
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-4 h-4 mr-2 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Role-Specific Friction
              </h4>
            </div>
            
            {data.problems.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-sm font-medium">
                No major issues detected from this perspective.
              </div>
            ) : (
              <div className="space-y-5">
                {data.problems.map((problem, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm shadow-slate-100/50">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-bold text-slate-900 text-base leading-snug pr-4">{problem.title}</h5>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        problem.impact === "High" ? "text-rose-700 bg-rose-50" :
                        problem.impact === "Medium" ? "text-amber-700 bg-amber-50" :
                        "text-blue-700 bg-blue-50"
                      }`}>
                        {problem.impact}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                      {problem.description}
                    </p>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm flex gap-3 items-start">
                      <Lightbulb className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Fix from this perspective:</span>
                        <span className="text-slate-600 leading-relaxed">{problem.fix}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations List */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                  Priority Improvements
                </h4>
              </div>
              <ul className="space-y-3">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold mr-3">{idx + 1}.</span>
                    <span className="text-slate-700 font-medium text-sm leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}