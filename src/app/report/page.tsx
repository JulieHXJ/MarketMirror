"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Persona, WebsiteAnalysis } from "@/lib/types";

interface ExtractedData {
  buySignal: number;
  willingnessToPay: {
    tooCheap: number;
    bargain: number;
    gettingExpensive: number;
    tooExpensive: number;
  };
  topObjections: string[];
  featureRanking: string[];
  discoveryChannel: string;
  currentSolution: string;
  killerQuote: string;
  surpriseInsight: string;
  overallSentiment: string;
  overallVerdict?: string;
  bugs?: string[];
  uxIssues?: string[];
  confusingElements?: string[];
  topDislikes?: string[];
  detailedFindings?: Finding[];
}

interface Finding {
  category: string;
  severity: "critical" | "major" | "medium" | "minor" | "positive";
  title: string;
  description: string;
  pageUrl?: string;
  evidence?: string;
  rootCauseType?: "system_bug" | "ux_friction" | "semantic_confusion" | "self_correction";
  /** Set when final buy signal contradicts an earlier harsh finding */
  convergenceNote?: string;
}

interface StoredResult {
  personaId: string;
  personaName: string;
  status: string;
  extractedData?: ExtractedData;
}

interface RunData {
  analysis: WebsiteAnalysis;
  personas: Persona[];
  results: StoredResult[];
  runId?: string;
}

interface PastRunSummary {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  config: { analysis: WebsiteAnalysis; personas: Persona[] };
  hasResults: boolean;
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span></div>}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const [data, setData] = useState<RunData | null>(null);
  const [pastRuns, setPastRuns] = useState<PastRunSummary[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string>("");
  const [activeSegment, setActiveSegment] = useState<"enterprise" | "startup" | "agency" | "developer" | "non-technical buyer" | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const runId = searchParams.get("run");

    if (runId) {
      loadRunFromDb(runId);
    } else {
      const raw = localStorage.getItem("nightshift-results");
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
        if (parsed.runId) setCurrentRunId(parsed.runId);
      }
    }

    fetch("/api/runs?limit=10")
      .then((r) => r.json())
      .then((d) => setPastRuns((d.runs || []).filter((r: PastRunSummary) => r.hasResults)))
      .catch(() => {});
  }, [searchParams]);

  async function loadRunFromDb(runId: string) {
    try {
      const res = await fetch(`/api/runs?id=${runId}`);
      const run = await res.json();
      if (run.config && run.results) {
        setData({ analysis: run.config.analysis, personas: run.config.personas, results: run.results, runId });
        setCurrentRunId(runId);
      }
    } catch {
      // fallback to localStorage
      const raw = localStorage.getItem("nightshift-results");
      if (raw) setData(JSON.parse(raw));
    }
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block mb-4">
              analytics
            </span>
            <h2 className="text-xl font-bold text-on-surface mb-2">
              No Report Available
            </h2>
            <p className="text-sm text-on-surface-variant mb-8">
              Run an analysis first — configure a website, select personas, and
              click &quot;Run Overnight&quot;.
            </p>
          </div>
        </div>
        {pastRuns.length > 0 && (
          <div className="mt-8">
            <label className="block text-xs font-mono text-on-surface-variant/60 uppercase tracking-widest mb-4">
              Past Reports
            </label>
            <div className="space-y-2">
              {pastRuns.map((run) => (
                <button
                  key={run.id}
                  onClick={() => router.push(`/report?run=${run.id}`)}
                  className="w-full text-left bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-on-surface">
                      {run.config?.analysis?.productName || "Unknown"}
                    </span>
                    <span className="text-[11px] font-mono text-on-surface-variant/60 ml-2">
                      {run.config?.personas?.length || 0} personas
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-on-surface-variant/60">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                  <span className="material-symbols-outlined text-primary/40 text-lg">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const { analysis, personas, results } = data;

  const classifySegment = (persona?: Persona): "enterprise" | "startup" | "agency" | "developer" | "non-technical buyer" => {
    const text = `${persona?.role || ""} ${persona?.background || ""} ${persona?.segment || ""}`.toLowerCase();
    if (/(enterprise|director|vp|chief|head\s+of|procurement|compliance)/.test(text)) return "enterprise";
    if (/(startup|founder|co-founder|seed|series\s*[ab]|early\s*stage)/.test(text)) return "startup";
    if (/(agency|consultant|consulting|freelance|studio)/.test(text)) return "agency";
    if (/(developer|engineer|devops|architect|technical\s+writer|programmer)/.test(text)) return "developer";
    return "non-technical buyer";
  };

  const completed = results.filter(
    (r) => r.status === "completed" && r.extractedData
  );
  const extracted = completed.map((r) => r.extractedData!);

  // --- Aggregations ---
  const avgBuySignal =
    extracted.length > 0
      ? extracted.reduce((sum, e) => sum + (e.buySignal || 0), 0) /
        extracted.length
      : 0;
  const demandPercent = Math.round(avgBuySignal * 100);
  const strongSignals = extracted.filter((e) => e.buySignal >= 0.6).length;

  const avgWTP =
    extracted.length > 0
      ? {
          tooCheap: Math.round(
            extracted.reduce(
              (s, e) => s + (e.willingnessToPay?.tooCheap || 0),
              0
            ) / extracted.length
          ),
          bargain: Math.round(
            extracted.reduce(
              (s, e) => s + (e.willingnessToPay?.bargain || 0),
              0
            ) / extracted.length
          ),
          gettingExpensive: Math.round(
            extracted.reduce(
              (s, e) => s + (e.willingnessToPay?.gettingExpensive || 0),
              0
            ) / extracted.length
          ),
          tooExpensive: Math.round(
            extracted.reduce(
              (s, e) => s + (e.willingnessToPay?.tooExpensive || 0),
              0
            ) / extracted.length
          ),
        }
      : null;

  const objectionCounts: Record<string, number> = {};
  extracted.forEach((e) => {
    (e.topObjections || []).forEach((obj) => {
      const key = obj.toLowerCase().trim();
      objectionCounts[key] = (objectionCounts[key] || 0) + 1;
    });
  });
  const topObjections = Object.entries(objectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const featureCounts: Record<string, number> = {};
  extracted.forEach((e) => {
    (e.featureRanking || []).forEach((feat, idx) => {
      const key = feat.trim();
      featureCounts[key] = (featureCounts[key] || 0) + (3 - Math.min(idx, 2));
    });
  });
  const topFeatures = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxFeatureScore = topFeatures[0]?.[1] || 1;

  const channelCounts: Record<string, number> = {};
  extracted.forEach((e) => {
    if (e.discoveryChannel) {
      const key = e.discoveryChannel.trim();
      channelCounts[key] = (channelCounts[key] || 0) + 1;
    }
  });
  const topChannels = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const buyQuotes = completed
    .filter((r) => r.extractedData && r.extractedData.buySignal >= 0.6)
    .map((r) => ({
      quote: r.extractedData!.killerQuote,
      persona: r.personaName,
    }))
    .filter((q) => q.quote)
    .slice(0, 3);

  const surprises = completed
    .map((r) => ({
      text: r.extractedData?.surpriseInsight,
      persona: r.personaName,
    }))
    .filter((s) => s.text)
    .slice(0, 3);

  const sentiments: Record<string, number> = {};
  extracted.forEach((e) => {
    if (e.overallSentiment) {
      const key = e.overallSentiment.trim();
      sentiments[key] = (sentiments[key] || 0) + 1;
    }
  });

  const solutionCounts: Record<string, number> = {};
  extracted.forEach((e) => {
    if (e.currentSolution) {
      const key = e.currentSolution.trim();
      solutionCounts[key] = (solutionCounts[key] || 0) + 1;
    }
  });
  const topSolutions = Object.entries(solutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Aggregate detailed findings across all personas
  const rawFindings: (Finding & { persona: string })[] = [];
  completed.forEach((r) => {
    (r.extractedData?.detailedFindings || []).forEach((f) => {
      rawFindings.push({ ...f, persona: r.personaName });
    });
  });

  // --- Verification Layer ---
  // 1. Heuristic: if feedback text contains a long sentence as the "click target",
  //    and rootCauseType is missing, infer semantic_confusion
  const allFindings = rawFindings.map((f) => {
    let rootCause = f.rootCauseType || "system_bug";

    // Auto-detect semantic confusion: long click target descriptions reported as bugs
    if (rootCause === "system_bug" && (f.category === "bug" || f.category === "confusion")) {
      const clickPatterns = /click(?:ing|ed)?\s+['""'"](.{40,})['""'"]/i;
      const match = f.description.match(clickPatterns);
      if (match) {
        rootCause = "semantic_confusion";
      }
    }

    // 2. Cross-check: group similar descriptions; if <5% of personas report the same
    //    "bug" and it looks like a text-click issue, downgrade to semantic_confusion
    if (rootCause === "system_bug" && f.severity === "critical") {
      const similarCount = rawFindings.filter((other) =>
        other.description === f.description || other.title === f.title
      ).length;
      const threshold = Math.max(1, Math.ceil(completed.length * 0.05));
      if (similarCount <= threshold && /did nothing|did not|does nothing|doesn't/i.test(f.description)) {
        rootCause = "ux_friction";
      }
    }

    // 3. Downgrade semantic_confusion from critical/major to minor
    let severity = f.severity;
    if (rootCause === "semantic_confusion" && (severity === "critical" || severity === "major")) {
      severity = "minor";
    }

    return { ...f, rootCauseType: rootCause as Finding["rootCauseType"], severity };
  });

  // --- Session convergence: high buy signal + "slow / nothing happened" → downgrade ---
  const transientIssueRx =
    /slow|delay|didn'?t (load|change|update)|not immediat|spinner|loading|stuck|wait|nothing happened|no response|frozen|async|did nothing|does nothing|blank for|for a moment/i;

  const allFindingsConverged: (Finding & { persona: string })[] = allFindings.map((f) => {
    const personaResult = completed.find((r) => r.personaName === f.persona);
    const buy = personaResult?.extractedData?.buySignal ?? 0;
    if (buy < 0.8) return f;

    if (
      (f.severity === "critical" || f.severity === "major") &&
      transientIssueRx.test(`${f.title} ${f.description}`)
    ) {
      return {
        ...f,
        severity: "minor" as const,
        rootCauseType: (f.rootCauseType === "system_bug" ? "ux_friction" : f.rootCauseType) as Finding["rootCauseType"],
        convergenceNote:
          "Final session buy signal is high — this reads as temporary confusion or slow SPA behavior, not a broken product.",
      };
    }
    return f;
  });

  const criticalFindings = allFindingsConverged.filter(
    (f) =>
      (f.severity === "critical" || f.severity === "major") &&
      f.rootCauseType !== "semantic_confusion" &&
      f.rootCauseType !== "self_correction"
  );
  const semanticFindings = allFindingsConverged.filter((f) => f.rootCauseType === "semantic_confusion");
  const uxFrictionFindings = allFindingsConverged.filter(
    (f) => f.rootCauseType === "ux_friction" && f.severity !== "positive"
  );
  const selfCorrectionFindings = allFindingsConverged.filter(
    (f) => f.rootCauseType === "self_correction"
  );

  const signalLabel =
    demandPercent >= 70
      ? "Strong Signal"
      : demandPercent >= 40
        ? "Moderate Signal"
        : "Weak Signal";

  const completedRatio = personas.length > 0 ? completed.length / personas.length : 0;
  const buySignalValues = extracted.map((e) => Math.max(0, Math.min(1, e.buySignal || 0)));
  const meanBuySignal = buySignalValues.length > 0 ? buySignalValues.reduce((s, v) => s + v, 0) / buySignalValues.length : 0;
  const variance =
    buySignalValues.length > 0
      ? buySignalValues.reduce((s, v) => s + Math.pow(v - meanBuySignal, 2), 0) / buySignalValues.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 1 - stdDev * 2);

  const overallProductMarketResonance = Math.round(meanBuySignal * 100);
  const personaRelevanceConfidence = Math.round((completedRatio * 0.6 + consistencyScore * 0.4) * 100);
  const intentToAdopt = Math.round((extracted.filter((e) => (e.buySignal || 0) >= 0.5).length / Math.max(1, extracted.length)) * 100);
  const trialLikelihood = Math.round((extracted.filter((e) => (e.buySignal || 0) >= 0.4 || e.wouldRecommend).length / Math.max(1, extracted.length)) * 100);
  const purchaseLikelihood = Math.round((extracted.filter((e) => (e.buySignal || 0) >= 0.7).length / Math.max(1, extracted.length)) * 100);

  const heatmapFeatures = Array.from(
    new Set([
      ...(analysis.keyFeatures || []),
      ...topFeatures.map(([feature]) => feature),
    ].filter(Boolean))
  ).slice(0, 6);

  const heatmapRows = completed.map((r) => {
    const persona = personas.find((p) => p.id === r.personaId);
    const ranking = r.extractedData?.featureRanking || [];
    const objectionsBlob = [
      ...(r.extractedData?.topObjections || []),
      ...(r.extractedData?.topDislikes || []),
      ...(r.extractedData?.uxIssues || []),
    ].join(" ").toLowerCase();

    const values = heatmapFeatures.map((feature) => {
      const rankIndex = ranking.findIndex((item) => item.toLowerCase().includes(feature.toLowerCase()));
      let score = rankIndex >= 0 ? Math.max(40, 100 - rankIndex * 20) : Math.round((r.extractedData?.buySignal || 0) * 100 * 0.45);
      if (objectionsBlob.includes(feature.toLowerCase())) score = Math.max(10, score - 25);
      return Math.max(0, Math.min(100, score));
    });

    return {
      persona: r.personaName,
      segment: classifySegment(persona),
      values,
    };
  });

  const positiveQuotes = completed
    .map((r) => ({
      quote: r.extractedData?.killerQuote || r.extractedData?.overallVerdict || "",
      persona: r.personaName,
      score: r.extractedData?.buySignal || 0,
    }))
    .filter((q) => q.quote && q.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const canonicalObjections = [
    "定价复杂",
    "安全性不明",
    "onboarding 太长",
    "value proposition 不清晰",
    "不知道和现有工具比强在哪",
  ];

  const objectionSignals = extracted.flatMap((e) => [
    ...(e.topObjections || []),
    ...(e.topDislikes || []),
    ...(e.uxIssues || []),
    ...(e.confusingElements || []),
  ]);

  const objectionBuckets = canonicalObjections.map((label) => {
    const keywordRegex =
      label === "定价复杂"
        ? /(pricing|price|cost|expensive|plan|tier|定价|价格)/i
        : label === "安全性不明"
          ? /(security|compliance|trust|privacy|data|安全|合规)/i
          : label === "onboarding 太长"
            ? /(onboarding|setup|integration|too long|复杂上手|学习成本)/i
            : label === "value proposition 不清晰"
              ? /(value proposition|unclear|not clear|positioning|卖点|价值)/i
              : /(alternative|competitor|vs|different|switch|现有工具|替代)/i;

    const count = objectionSignals.filter((text) => keywordRegex.test(text)).length;
    return { label, count };
  }).sort((a, b) => b.count - a.count);

  const normalizedFeatureScores = topFeatures.map(([feature, score]) => ({
    feature,
    score: Math.round((score / Math.max(1, maxFeatureScore)) * 100),
  }));
  const mustHave = normalizedFeatureScores.filter((f) => f.score >= 70).slice(0, 5);
  const shouldHave = normalizedFeatureScores.filter((f) => f.score >= 40 && f.score < 70).slice(0, 5);
  const niceToHave = normalizedFeatureScores.filter((f) => f.score < 40).slice(0, 5);

  const segmentOrder: Array<"enterprise" | "startup" | "agency" | "developer" | "non-technical buyer"> = [
    "enterprise",
    "startup",
    "agency",
    "developer",
    "non-technical buyer",
  ];

  const segmentStats = segmentOrder.map((segmentKey) => {
    const rows = completed.filter((r) => {
      const persona = personas.find((p) => p.id === r.personaId);
      return classifySegment(persona) === segmentKey;
    });
    const avgScore = rows.length > 0
      ? Math.round((rows.reduce((sum, r) => sum + (r.extractedData?.buySignal || 0), 0) / rows.length) * 100)
      : 0;
    const strongestQuote = rows
      .map((r) => r.extractedData?.killerQuote || "")
      .find(Boolean);

    return {
      segment: segmentKey,
      count: rows.length,
      avgScore,
      strongestQuote,
      topObjection: rows
        .flatMap((r) => r.extractedData?.topObjections || [])
        .find(Boolean),
      personas: rows.map((r) => {
        const persona = personas.find((p) => p.id === r.personaId);
        return {
          name: r.personaName,
          role: persona?.role || "Unknown Role",
          buySignal: Math.round((r.extractedData?.buySignal || 0) * 100),
          quote: r.extractedData?.killerQuote || r.extractedData?.overallVerdict || "",
          objections: (r.extractedData?.topObjections || []).slice(0, 2),
        };
      }),
    };
  });

  const selectedSegmentKey =
    activeSegment && segmentStats.some((s) => s.segment === activeSegment)
      ? activeSegment
      : segmentStats.find((s) => s.count > 0)?.segment || "enterprise";
  const selectedSegment = segmentStats.find((s) => s.segment === selectedSegmentKey) || segmentStats[0];

  // --- Environment Warning Detection ---
  const failedCount = results.filter((r) => r.status === "failed").length;
  const zeroBuyCount = extracted.filter((e) => e.buySignal === 0 || !e.buySignal).length;
  const accessIssueKeywords = /unable to.*evaluat|environment|consent|login.*wall|captcha|blocked|access.*restrict|cannot.*access|could not.*access/i;
  const accessBlockedCount = extracted.filter((e) =>
    accessIssueKeywords.test(e.overallSentiment || "") ||
    accessIssueKeywords.test(e.overallVerdict || "")
  ).length;

  const blankScreenKeywords =
    /blank screen|blank page|empty screen|page is empty|nothing visible|no content|schwarz|schwarzer bildschirm|weißer bildschirm|black screen|went blank|completely empty/i;

  function textBlob(e: ExtractedData): string {
    return [
      e.killerQuote,
      e.overallSentiment,
      e.overallVerdict,
      ...(e.bugs || []),
      ...(e.uxIssues || []),
      ...(e.confusingElements || []),
      ...(e.topDislikes || []),
      ...(e.topObjections || []),
    ]
      .filter(Boolean)
      .join(" ");
  }

  const blankScreenCount = extracted.filter((e) => blankScreenKeywords.test(textBlob(e))).length;
  /** 100% personas describe blank/empty after load — likely consent wall / anti-bot, not product quality */
  const consentWallBlankConsensus =
    completed.length > 0 &&
    blankScreenCount === completed.length &&
    (demandPercent === 0 || zeroBuyCount === extracted.length);

  const hasEnvironmentWarning =
    consentWallBlankConsensus ||
    (failedCount > results.length * 0.5) ||
    (zeroBuyCount >= extracted.length && extracted.length > 0 && demandPercent === 0) ||
    (accessBlockedCount > completed.length * 0.5);

  return (
    <>
      {/* Environment Warning */}
      {hasEnvironmentWarning && (
        <section className="px-6 lg:px-10 pt-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex items-start gap-4">
              <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0 mt-0.5">warning</span>
              <div>
                <h3 className="text-sm font-bold text-amber-500 mb-1">Environment Warning</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {consentWallBlankConsensus
                    ? "Every persona reported a blank or empty page after navigation — this pattern usually means a Consent Wall, bot challenge, or network blocking, not a product failure. Results are not reliable for product-market fit. Please verify network access, anti-bot settings, and try again in a non-headless or residential environment if needed."
                    : failedCount > results.length * 0.5
                      ? `${failedCount} of ${results.length} interviews failed. The test environment may have blocked access (consent walls, CAPTCHAs, login requirements, or firewall rules).`
                      : accessBlockedCount > completed.length * 0.5
                        ? `${accessBlockedCount} of ${completed.length} personas reported access limitations. The results below may not reflect the actual product quality.`
                        : `All ${extracted.length} personas gave a 0% buy signal. This typically indicates the testing environment was blocked by consent walls, login requirements, or geographic restrictions — not that the product has zero value.`
                  }
                  {" "}Consider re-running the test with a different URL or after verifying the site is accessible from the testing environment.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Header with Demand Gauge */}
      <section className="p-6 lg:p-10 bg-surface-container-low border-b border-outline-variant/5">
        <div className="max-w-6xl mx-auto">
          {/* Past reports selector */}
          {pastRuns.length > 1 && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest shrink-0">
                Compare:
              </label>
              <div className="flex gap-2 flex-wrap">
                {pastRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => router.push(`/report?run=${run.id}`)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                      currentRunId === run.id
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-surface-container border-outline-variant/10 text-on-surface-variant hover:border-primary/20"
                    }`}
                  >
                    {run.config?.analysis?.productName || "Run"} - {new Date(run.startedAt).toLocaleDateString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_#a7d641]" />
                <span className="text-xs font-mono text-tertiary tracking-widest uppercase">
                  Analysis Complete
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface mb-2">
                Morning Report
              </h2>
              <p
                className={`text-sm text-on-surface-variant ${
                  selfCorrectionFindings.length > 0 ? "mb-2" : "mb-4"
                }`}
              >
                {analysis.productName} — {analysis.industry}
              </p>
              {selfCorrectionFindings.length > 0 && (
                <p className="text-xs text-on-surface-variant/90 leading-relaxed mb-4 max-w-2xl">
                  Session analysis merged {selfCorrectionFindings.length} failure-and-recovery sequence
                  {selfCorrectionFindings.length === 1 ? "" : "s"} into interaction-friction insights (severity capped where users reached their goal via an alternate path).
                </p>
              )}
              <div className="flex gap-4">
                <div className="px-3 py-1 bg-surface-container-high rounded text-[10px] font-mono text-on-surface-variant border border-outline-variant/20 uppercase">
                  {completed.length}/{results.length} Interviews
                </div>
                <div className="px-3 py-1 bg-surface-container-high rounded text-[10px] font-mono text-on-surface-variant border border-outline-variant/20 uppercase">
                  {personas.length} Personas
                </div>
              </div>
            </div>

            {/* Gauge */}
            <div className="relative w-64 h-40 flex items-end justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-t-full border-[16px] border-surface-container-highest" />
              <div
                className="absolute inset-0 rounded-t-full border-[16px] border-primary shadow-[0_0_40px_rgba(164,201,255,0.2)]"
                style={{
                  clipPath: `polygon(0 100%, 0 0, ${demandPercent}% 0, ${demandPercent}% 100%)`,
                }}
              />
              <div className="z-10 text-center pb-2">
                <div className="text-5xl font-black text-on-surface tracking-tighter">
                  {demandPercent}%
                </div>
                <div className="text-[10px] font-mono text-primary font-bold tracking-[0.2em] uppercase">
                  {signalLabel}
                </div>
              </div>
            </div>

            {/* Intent card */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 w-full md:w-72">
              <div className="text-[10px] font-mono text-on-surface-variant uppercase mb-2">
                Buy Signals
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-surface tracking-tighter">
                  {strongSignals}
                </span>
                <span className="text-lg text-on-surface-variant">
                  / {completed.length}
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${completed.length > 0 ? (strongSignals / completed.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-3 text-[10px] text-on-surface-variant">
                Personas with buy signal &ge; 0.6
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-12">
        <section className="space-y-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">
            Top KPI
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Overall product-market resonance", value: overallProductMarketResonance },
              { label: "Persona relevance confidence", value: personaRelevanceConfidence },
              { label: "Intent to adopt", value: intentToAdopt },
              { label: "Trial likelihood", value: trialLikelihood },
              { label: "Purchase likelihood", value: purchaseLikelihood },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
                <div className="text-[10px] font-mono uppercase text-on-surface-variant mb-2">{kpi.label}</div>
                <div className="text-2xl font-bold text-on-surface">{kpi.value}%</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">
            Heatmap
          </h3>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 overflow-auto">
            <div className="grid gap-2" style={{ gridTemplateColumns: `180px repeat(${Math.max(1, heatmapFeatures.length)}, minmax(120px, 1fr))` }}>
              <div className="text-[10px] font-mono text-on-surface-variant uppercase px-2 py-1">角色 / 用户段</div>
              {heatmapFeatures.map((feature) => (
                <div key={feature} className="text-[10px] font-mono text-on-surface-variant uppercase px-2 py-1 text-center">{feature}</div>
              ))}

              {heatmapRows.map((row) => (
                <>
                  <div key={`${row.persona}-label`} className="text-xs text-on-surface px-2 py-2 rounded bg-surface-container border border-outline-variant/10">
                    <div className="font-semibold">{row.persona}</div>
                    <div className="text-[10px] font-mono uppercase text-on-surface-variant">{row.segment}</div>
                  </div>
                  {row.values.map((value, idx) => (
                    <div
                      key={`${row.persona}-${idx}`}
                      className="rounded text-center text-[10px] font-mono py-2 border border-primary/20"
                      style={{
                        backgroundColor: `rgba(164, 201, 255, ${Math.max(0.08, value / 100)})`,
                        color: value >= 55 ? "#0b1220" : "#d3e1ff",
                      }}
                    >
                      {value}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">
            Willingness to Pay Curve
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completed.map((r) => {
              const wtp = r.extractedData?.willingnessToPay;
              if (!wtp) return null;
              const min = Math.max(0, Math.min(wtp.tooCheap || 0, wtp.bargain || 0));
              const sweetLow = Math.min(wtp.bargain || 0, wtp.gettingExpensive || 0);
              const sweetHigh = Math.max(wtp.bargain || 0, wtp.gettingExpensive || 0);
              const acceptableHigh = Math.max(sweetHigh, wtp.tooExpensive || 0);
              const scaleMax = Math.max(acceptableHigh, 1);
              return (
                <div key={r.personaId} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-bold text-on-surface">{r.personaName}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">sweet spot ${sweetLow} - ${sweetHigh}</div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden flex">
                    <div className="h-full bg-error/60" style={{ width: `${(min / scaleMax) * 100}%` }} title="unacceptable" />
                    <div className="h-full bg-tertiary-container" style={{ width: `${((sweetLow - min) / scaleMax) * 100}%` }} title="acceptable" />
                    <div className="h-full bg-tertiary" style={{ width: `${((sweetHigh - sweetLow) / scaleMax) * 100}%` }} title="sweet spot" />
                    <div className="h-full bg-primary/70" style={{ width: `${((acceptableHigh - sweetHigh) / scaleMax) * 100}%` }} title="premium resistance" />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-on-surface-variant">
                    <div>unacceptable: &lt; ${wtp.tooCheap}</div>
                    <div>acceptable: ${wtp.tooCheap} - ${wtp.gettingExpensive}</div>
                    <div>sweet spot: ${wtp.bargain} - ${wtp.gettingExpensive}</div>
                    <div>premium resistance: &gt; ${wtp.tooExpensive}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">Buy Signals</h3>
            <div className="space-y-3">
              {positiveQuotes.length > 0 ? positiveQuotes.map((q, idx) => (
                <div key={`${q.persona}-${idx}`} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
                  <p className="text-sm text-on-surface italic">&ldquo;{q.quote}&rdquo;</p>
                  <p className="text-[10px] font-mono text-on-surface-variant mt-2">{q.persona}</p>
                </div>
              )) : (
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant">No strong positive quote captured yet.</div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">Objections</h3>
            <div className="space-y-3">
              {objectionBuckets.map((item) => (
                <div key={item.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-on-surface">{item.label}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{item.count} mentions</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-error" style={{ width: `${Math.min(100, (item.count / Math.max(1, extracted.length)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">Surprises</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(surprises.length > 0 ? surprises : [
              { text: "某个你们没预期的角色反而最感兴趣", persona: "system" },
              { text: "某个功能比主页主打卖点更吸引人", persona: "system" },
              { text: "某个页面文案强烈影响信任", persona: "system" },
            ]).slice(0, 3).map((s, idx) => (
              <div key={`${s.persona}-${idx}`} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
                <p className="text-sm text-on-surface">{s.text}</p>
                <p className="text-[10px] font-mono text-on-surface-variant mt-2">{s.persona}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">Priority Tier List</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "must-have", items: mustHave, color: "text-tertiary" },
              { title: "should-have", items: shouldHave, color: "text-primary" },
              { title: "nice-to-have", items: niceToHave, color: "text-on-surface-variant" },
            ].map((tier) => (
              <div key={tier.title} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
                <div className={`text-[10px] font-mono uppercase mb-3 ${tier.color}`}>{tier.title}</div>
                <div className="space-y-2">
                  {tier.items.length > 0 ? tier.items.map((item) => (
                    <div key={item.feature} className="bg-surface-container p-2 rounded border border-outline-variant/10 flex justify-between">
                      <span className="text-xs text-on-surface truncate pr-2">{item.feature}</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">{item.score}%</span>
                    </div>
                  )) : (
                    <div className="text-xs text-on-surface-variant">No items in this tier.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant">Segment Deep Dive</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {segmentStats.map((segment) => (
              <button
                key={segment.segment}
                type="button"
                onClick={() => setActiveSegment(segment.segment)}
                className={`text-left bg-surface-container-lowest p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedSegmentKey === segment.segment
                    ? "border-primary/40 bg-primary/5"
                    : "border-outline-variant/10 hover:border-primary/20"
                }`}
              >
                <div className="text-xs font-bold text-on-surface capitalize mb-2">{segment.segment}</div>
                <div className="text-[10px] font-mono text-on-surface-variant mb-1">personas: {segment.count}</div>
                <div className="text-[10px] font-mono text-on-surface-variant mb-2">resonance: {segment.avgScore}%</div>
                {segment.topObjection && (
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">objection: {segment.topObjection}</p>
                )}
                {segment.strongestQuote && (
                  <p className="text-[11px] text-on-surface italic mt-2 line-clamp-3">&ldquo;{segment.strongestQuote}&rdquo;</p>
                )}
              </button>
            ))}
          </div>

          {selectedSegment && (
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-on-surface capitalize">{selectedSegment.segment}</h4>
                  <p className="text-[10px] font-mono text-on-surface-variant">
                    {selectedSegment.count} personas · average resonance {selectedSegment.avgScore}%
                  </p>
                </div>
                {selectedSegment.topObjection && (
                  <div className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-3 py-1 rounded border border-outline-variant/10">
                    top objection: {selectedSegment.topObjection}
                  </div>
                )}
              </div>

              {selectedSegment.personas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSegment.personas.map((persona) => (
                    <div key={persona.name} className="bg-surface-container p-3 rounded-lg border border-outline-variant/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-semibold text-on-surface">{persona.name}</div>
                        <div className="text-[10px] font-mono text-primary">{persona.buySignal}%</div>
                      </div>
                      <div className="text-[10px] font-mono text-on-surface-variant mb-2">{persona.role}</div>
                      {persona.quote && (
                        <p className="text-[11px] text-on-surface italic line-clamp-2 mb-2">&ldquo;{persona.quote}&rdquo;</p>
                      )}
                      {persona.objections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {persona.objections.map((objection) => (
                            <span key={objection} className="text-[10px] font-mono text-error bg-error/10 px-2 py-0.5 rounded">
                              {objection}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No completed personas in this segment yet.</p>
              )}
            </div>
          )}
        </section>

        {/* Confirmed Issues (system_bug + ux_friction, critical/major only) */}
        {criticalFindings.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-error mb-2">
              Confirmed Issues
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Verified problems — real bugs and UX friction points reported by personas.
            </p>
            <div className="space-y-4">
              {criticalFindings.map((f, i) => (
                <div
                  key={i}
                  className={`bg-surface-container-lowest p-6 rounded-xl border-l-4 ${
                    f.severity === "critical" ? "border-error" : "border-amber-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        f.severity === "critical"
                          ? "bg-error/10 text-error"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {f.severity}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant/60 bg-surface-container px-2 py-0.5 rounded">
                        {f.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          f.rootCauseType === "system_bug"
                            ? "bg-error/10 text-error"
                            : f.rootCauseType === "self_correction"
                              ? "bg-primary/10 text-primary"
                              : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {f.rootCauseType === "system_bug"
                          ? "System Bug"
                          : f.rootCauseType === "self_correction"
                            ? "Self-Correction"
                            : "UX Friction"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant/40">
                      {f.persona}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-2">{f.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                    {f.description}
                  </p>
                  {f.pageUrl && (
                    <div className="text-[10px] font-mono text-primary/70 mb-2">
                      Page: {f.pageUrl}
                    </div>
                  )}
                  {f.evidence && (
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/10">
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase mb-1">Evidence</p>
                      <p className="text-xs text-on-surface-variant italic">&ldquo;{f.evidence}&rdquo;</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interaction friction — failure then recovery on same goal (session merge) */}
        {selfCorrectionFindings.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-primary mb-2">
              Interaction Friction &amp; Self-Correction
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Users hit a real obstacle but completed the task through another path (e.g. direct URL). These are not dead-end failures — severity is downgraded accordingly.
            </p>
            <div className="space-y-4">
              {selfCorrectionFindings.map((f, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary/50"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          f.severity === "medium"
                            ? "bg-primary/15 text-primary"
                            : f.severity === "minor"
                              ? "bg-surface-container text-on-surface-variant"
                              : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant/60 bg-surface-container px-2 py-0.5 rounded">
                        {f.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary">
                        Self-Correction
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant/40">{f.persona}</span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-2">{f.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{f.description}</p>
                  {f.pageUrl && (
                    <div className="text-[10px] font-mono text-primary/70 mb-2">Page: {f.pageUrl}</div>
                  )}
                  {f.evidence && (
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/10">
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase mb-1">Evidence</p>
                      <p className="text-xs text-on-surface-variant italic whitespace-pre-wrap">
                        &ldquo;{f.evidence}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* UX Friction — things that work but are hard to find/use */}
        {uxFrictionFindings.length > 0 && uxFrictionFindings.some((f) => f.severity === "minor") && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-amber-500 mb-2">
              UX Friction Points
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Features that work but were hard to find or confusing to use.
            </p>
            <div className="space-y-3">
              {uxFrictionFindings.filter((f) => f.severity === "minor").map((f, i) => (
                <div key={i} className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-amber-500/40">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-600">
                        UX Friction
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant/40">{f.persona}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{f.description}</p>
                  {f.pageUrl && (
                    <div className="text-[10px] font-mono text-primary/70 mt-2">Page: {f.pageUrl}</div>
                  )}
                  {f.convergenceNote && (
                    <p className="text-[10px] text-primary/80 mt-2 italic border-t border-outline-variant/10 pt-2">
                      {f.convergenceNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Semantic Confusion — persona mistakes, not real bugs */}
        {semanticFindings.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant/60 mb-2">
              Filtered Out: User Confusion
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Issues caused by personas clicking non-interactive text (headings, descriptions) instead of the actual buttons.
              These are NOT website bugs — they indicate the persona misidentified the click target.
            </p>
            <div className="space-y-2">
              {semanticFindings.map((f, i) => (
                <div key={i} className="bg-surface-container-lowest/50 p-4 rounded-xl border border-outline-variant/5 opacity-60">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-container text-on-surface-variant/50">
                        Semantic Confusion
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant/30 line-through">{f.category}</span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant/30">{f.persona}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant/50 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Willingness to Pay */}
        {avgWTP && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Willingness to Pay (Avg. Van Westendorp)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Too Cheap", value: avgWTP.tooCheap, color: "text-on-surface-variant" },
                { label: "Bargain", value: avgWTP.bargain, color: "text-tertiary" },
                { label: "Getting Expensive", value: avgWTP.gettingExpensive, color: "text-primary" },
                { label: "Too Expensive", value: avgWTP.tooExpensive, color: "text-error" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 text-center"
                >
                  <p className="text-[10px] font-mono text-on-surface-variant uppercase mb-2">
                    {item.label}
                  </p>
                  <p className={`text-3xl font-bold ${item.color}`}>
                    ${item.value}
                  </p>
                </div>
              ))}
            </div>
            {avgWTP.bargain > 0 && avgWTP.gettingExpensive > 0 && (
              <div className="mt-4 bg-tertiary-container text-on-tertiary-container px-4 py-2 rounded-lg inline-block text-sm font-bold">
                Sweet Spot: ${avgWTP.bargain} — ${avgWTP.gettingExpensive}
              </div>
            )}
          </section>
        )}

        {/* Killer Quotes */}
        {buyQuotes.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Killer Quotes (High Buy Signal)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {buyQuotes.map((q, i) => (
                <div
                  key={i}
                  className="bg-surface-container p-6 rounded-xl border-l-4 border-tertiary"
                >
                  <p className="text-sm italic text-on-surface leading-relaxed mb-4">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-[10px]">
                        person
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      {q.persona}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Surprise Insights */}
        {surprises.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Surprise Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {surprises.map((s, i) => (
                <div
                  key={i}
                  className="bg-surface-container p-6 rounded-xl border-l-4 border-primary"
                >
                  <p className="text-sm text-on-surface leading-relaxed mb-4">
                    {s.text}
                  </p>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {s.persona}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Objections */}
        {topObjections.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Top Objections
            </h3>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 space-y-5">
              {topObjections.map(([objection, count]) => {
                const pct = Math.round(
                  (count / completed.length) * 100
                );
                return (
                  <div key={objection}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-on-surface capitalize">
                        {objection}
                      </span>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {count}x ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 60 ? "bg-error" : pct >= 30 ? "bg-tertiary-container" : "bg-outline-variant"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Feature Priorities */}
        {topFeatures.length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Feature Priorities (weighted by ranking)
            </h3>
            <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 space-y-4">
              {topFeatures.map(([feature, score]) => (
                <div key={feature} className="flex items-center gap-4">
                  <span className="w-48 text-xs font-mono text-on-surface-variant truncate shrink-0">
                    {feature}
                  </span>
                  <div className="flex-1 h-6 bg-surface-container-high rounded-r relative">
                    <div
                      className="h-full bg-primary rounded-r"
                      style={{
                        width: `${(score / maxFeatureScore) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant w-8 text-right">
                    {score}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discovery Channels + Current Solutions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {topChannels.length > 0 && (
            <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
              <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
                Discovery Channels
              </h3>
              <div className="space-y-3">
                {topChannels.map(([channel, count]) => (
                  <div
                    key={channel}
                    className="flex items-center justify-between bg-surface-container p-3 rounded-lg"
                  >
                    <span className="text-xs text-on-surface">{channel}</span>
                    <span className="text-[10px] font-mono text-primary">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topSolutions.length > 0 && (
            <section className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10">
              <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
                Current Solutions (Competitors)
              </h3>
              <div className="space-y-3">
                {topSolutions.map(([solution, count]) => (
                  <div
                    key={solution}
                    className="flex items-center justify-between bg-surface-container p-3 rounded-lg"
                  >
                    <span className="text-xs text-on-surface">{solution}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sentiment Overview */}
        {Object.keys(sentiments).length > 0 && (
          <section>
            <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
              Overall Sentiment
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(sentiments)
                .sort((a, b) => b[1] - a[1])
                .map(([sentiment, count]) => (
                  <div
                    key={sentiment}
                    className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/10"
                  >
                    <span className="text-xs text-on-surface">{sentiment}</span>
                    <span className="ml-2 text-[10px] font-mono text-primary">
                      {count}x
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Persona Breakdown */}
        <section>
          <h3 className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mb-6">
            Per-Persona Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((r) => {
              const persona = personas.find((p) => p.id === r.personaId);
              const e = r.extractedData!;
              const personaFindings = allFindingsConverged.filter((f) => f.persona === r.personaName);
              return (
                <div
                  key={r.personaId}
                  className="bg-surface-container p-5 rounded-xl border border-outline-variant/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">
                        {persona?.icon || "person"}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">
                        {r.personaName}
                      </h4>
                      <p className="text-[10px] font-mono text-on-surface-variant">
                        {persona?.role}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Buy Signal</span>
                      <span
                        className={`font-mono font-bold ${e.buySignal >= 0.6 ? "text-tertiary" : e.buySignal >= 0.3 ? "text-primary" : "text-error"}`}
                      >
                        {(e.buySignal * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Sentiment</span>
                      <span className="font-mono text-on-surface">
                        {e.overallSentiment}
                      </span>
                    </div>
                    {personaFindings.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Issues Found</span>
                        <span className="font-mono text-error">
                          {personaFindings.length}
                        </span>
                      </div>
                    )}
                    {e.killerQuote && (
                      <p className="text-on-surface-variant italic text-[11px] mt-2 border-t border-outline-variant/10 pt-2">
                        &ldquo;{e.killerQuote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
