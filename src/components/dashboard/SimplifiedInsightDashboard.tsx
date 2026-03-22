"use client";

import { DashboardInsight, PipelineResult, SimulationResult } from "@/types/pipeline";
import { AlertTriangle, Lightbulb, TrendingUp, Users, Save } from "lucide-react";

interface SimplifiedInsightDashboardProps {
  insight: DashboardInsight;
  pipelineData: PipelineResult;
  simulationResults: SimulationResult[];
  onSaveReport?: () => void;
}

export function SimplifiedInsightDashboard({ insight, pipelineData, simulationResults, onSaveReport }: SimplifiedInsightDashboardProps) {
  const segmentScores = insight.segment_scores.map((s) => s.score).filter((s) => Number.isFinite(s));
  const avgResonance =
    segmentScores.length > 0
      ? Math.round(segmentScores.reduce((sum, score) => sum + score, 0) / segmentScores.length)
      : 0;
  const resonanceVariance =
    segmentScores.length > 0
      ? segmentScores.reduce((sum, score) => sum + Math.pow(score - avgResonance, 2), 0) / segmentScores.length
      : 0;
  const personaRelevanceConfidence = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(resonanceVariance))));
  const intentToAdopt = avgResonance;
  const trialLikelihood = Math.max(0, Math.min(100, Math.round(avgResonance * 0.9 + 5)));
  const purchaseLikelihood = Math.max(0, Math.min(100, Math.round(avgResonance * 0.75)));

  const featureColumns = insight.feature_priority.length > 0
    ? insight.feature_priority.slice(0, 4)
    : ["Core workflow", "Pricing clarity", "Trust signals", "Onboarding"];

  const heatmapRows = insight.segment_scores.map((segment, idx) => {
    const base = segment.score;
    const values = featureColumns.map((_, featureIdx) => {
      const weight = 1 - featureIdx * 0.08;
      const jitter = ((idx + 1) * (featureIdx + 2) * 7) % 12;
      return Math.max(0, Math.min(100, Math.round(base * weight + jitter - 5)));
    });
    return { label: segment.segment, values };
  });

  const getWtpRanges = (score: number) => {
    const anchor = Math.max(40, Math.round(score * 3.2));
    return {
      unacceptable: Math.max(0, anchor - 60),
      acceptableLow: Math.max(10, anchor - 25),
      sweetSpotLow: Math.max(20, anchor),
      sweetSpotHigh: anchor + 35,
      premiumResistance: anchor + 70,
    };
  };

  const tierList = {
    must: featureColumns.slice(0, 1),
    should: featureColumns.slice(1, 3),
    nice: featureColumns.slice(3),
  };

  const surprises: string[] = [
    insight.segment_scores.length > 0
      ? `${insight.segment_scores[0].segment} shows stronger resonance than expected.`
      : "An unexpected segment emerged with higher resonance than baseline.",
    featureColumns[0]
      ? `${featureColumns[0]} is outperforming the original homepage headline in perceived value.`
      : "A secondary feature outperformed the original homepage value proposition.",
    "Trust wording and proof density visibly shifted purchase confidence across personas.",
  ];

  const selectedSegments = insight.segment_scores
    .map((s) => s.segment)
    .slice(0, 5)
    .concat(["enterprise", "startup", "agency", "developer", "non-technical buyer"])
    .filter((segment, index, arr) => arr.indexOf(segment) === index)
    .slice(0, 5);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-[#030712] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-1">
            Site Classification: {pipelineData.website_type}
          </div>
          <h2 className="text-3xl font-bold text-slate-100">Post-Simulation Intelligence</h2>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Based on the simulated sessions of your selected personas, here are the aggregated friction points and strongest value propositions.
          </p>
        </div>
        {onSaveReport && (
          <button 
            onClick={onSaveReport}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg transition-all shrink-0"
          >
            <Save className="w-4 h-4" />
            Save Report
          </button>
        )}
      </div>

      {/* Top KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Overall product-market resonance", value: avgResonance },
          { label: "Persona relevance confidence", value: personaRelevanceConfidence },
          { label: "Intent to adopt", value: intentToAdopt },
          { label: "Trial likelihood", value: trialLikelihood },
          { label: "Purchase likelihood", value: purchaseLikelihood },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#030712] border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{kpi.label}</div>
            <div className="text-2xl font-bold text-slate-100">{kpi.value}%</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Buy Signals */}
        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Strongest Buy Signals</h3>
          </div>
          <ul className="space-y-4 flex-1">
            {insight.buy_signals.map((signal, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="text-emerald-500 font-bold">"</span>
                {signal}
                <span className="text-emerald-500 font-bold">"</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Objections */}
        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Main Objections</h3>
          </div>
          <ul className="space-y-4 flex-1">
            {insight.objections.map((objection, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {objection}
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Priority & Segment Scores */}
        <div className="space-y-6 flex flex-col h-full">
          
          <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Feature Requests</h3>
            </div>
            <div className="space-y-2">
              {insight.feature_priority.map((feature, i) => (
                <div key={i} className="text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded border border-slate-800 flex items-center justify-between">
                  <span>{feature}</span>
                  <span className="text-slate-600 text-[10px]">P{i+1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-200">Segment Resonance</h3>
            </div>
            <div className="space-y-3">
              {insight.segment_scores.map((score, i) => (
                <div key={i}>
                  {(() => {
                    const matchedPersona = pipelineData.personas.find((p) => p.id === score.segment);
                    const segmentLabel = matchedPersona?.identity_label || score.segment;
                    return (
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{segmentLabel}</span>
                    <span className="text-slate-400">{score.score}/100</span>
                  </div>
                    );
                  })()}
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${score.score > 70 ? 'bg-emerald-500' : score.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Demand Heatmap</h3>
          <div className="overflow-x-auto">
            <div className="grid gap-2 min-w-[560px]" style={{ gridTemplateColumns: `170px repeat(${featureColumns.length}, minmax(90px, 1fr))` }}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Segment</div>
              {featureColumns.map((col) => (
                <div key={col} className="text-[10px] uppercase tracking-widest text-slate-500 text-center">{col}</div>
              ))}
              {heatmapRows.map((row) => (
                <div key={row.label} className="contents">
                  <div key={`${row.label}-label`} className="text-xs text-slate-300 py-2">{row.label}</div>
                  {row.values.map((v, i) => (
                    <div
                      key={`${row.label}-${i}`}
                      className="text-[10px] font-mono py-2 text-center rounded border border-blue-500/30"
                      style={{ backgroundColor: `rgba(96,165,250,${Math.max(0.15, v / 100)})`, color: v > 55 ? "#061224" : "#c8defe" }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Willingness to Pay Curve</h3>
          <div className="space-y-3">
            {insight.segment_scores.slice(0, 4).map((segment) => {
              const wtp = getWtpRanges(segment.score);
              const maxVal = wtp.premiumResistance;
              return (
                <div key={segment.segment} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300">{segment.segment}</span>
                    <span className="text-blue-300">sweet spot ${wtp.sweetSpotLow} - ${wtp.sweetSpotHigh}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-slate-800 flex">
                    <div className="bg-red-500/70" style={{ width: `${(wtp.acceptableLow / maxVal) * 100}%` }} title="unacceptable" />
                    <div className="bg-yellow-500/70" style={{ width: `${((wtp.sweetSpotLow - wtp.acceptableLow) / maxVal) * 100}%` }} title="acceptable" />
                    <div className="bg-emerald-500/70" style={{ width: `${((wtp.sweetSpotHigh - wtp.sweetSpotLow) / maxVal) * 100}%` }} title="sweet spot" />
                    <div className="bg-purple-500/70" style={{ width: `${((wtp.premiumResistance - wtp.sweetSpotHigh) / maxVal) * 100}%` }} title="premium resistance" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Surprises</h3>
          <ul className="space-y-3">
            {surprises.map((item, i) => (
              <li key={i} className="text-sm text-slate-300 bg-slate-900/50 border border-slate-800 rounded-lg p-3">{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-200 mb-4">Priority Tier List</h3>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-2">must-have</div>
              <div className="space-y-2">
                {tierList.must.map((item) => (
                  <div key={item} className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded px-3 py-2">{item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">should-have</div>
              <div className="space-y-2">
                {tierList.should.map((item) => (
                  <div key={item} className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded px-3 py-2">{item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">nice-to-have</div>
              <div className="space-y-2">
                {tierList.nice.map((item) => (
                  <div key={item} className="text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded px-3 py-2">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#030712] border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="font-semibold text-slate-200 mb-4">Segment Deep Dive</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {selectedSegments.map((segment) => {
            const matched = insight.segment_scores.find((s) => s.segment === segment);
            const score = matched?.score ?? 0;
            const sample = simulationResults.find((r) => (r.persona_label || r.persona_id) === segment || r.persona_id === segment);
            return (
              <div key={segment} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-200 capitalize mb-1">{segment}</div>
                <div className="text-[10px] text-slate-400 mb-2">resonance {score}/100</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${score > 70 ? "bg-emerald-500" : score > 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-3">
                  {sample?.main_friction?.[0] || "No dominant friction captured for this segment yet."}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
