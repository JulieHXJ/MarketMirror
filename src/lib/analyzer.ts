/**
 * Session-level analysis for persona feedback: merge failure→recovery pairs,
 * guard against mis-tagged praise as bugs, and emit analyst-style copy.
 */

export type SessionRootCause =
  | "system_bug"
  | "ux_friction"
  | "semantic_confusion"
  | "self_correction";

export type SessionSeverity = "critical" | "major" | "medium" | "minor" | "positive";

export interface SessionFeedbackItem {
  feedback: string;
  category: string;
  severity: string;
  pageUrl: string;
  rootCauseType: string;
  /** Order of give_feedback within this persona run */
  feedbackIndex: number;
}

export interface AnalyzedFinding {
  category: string;
  severity: SessionSeverity;
  title: string;
  description: string;
  pageUrl?: string;
  evidence?: string;
  rootCauseType: SessionRootCause;
}

const POSITIVE_PHRASES =
  /\b(worked fine|works fine|working fine|good variety|no issues|no problem|worked well|works well|successfully|was able to|managed to|finally got|got it working|impressed|great experience|love(d)?\s|smooth experience|good experience|recovered|via (direct )?url|direct navigation|navigation succeeded|reached the|got to the results)\b/i;

const RECOVERY_SIGNALS =
  /\b(navigated|direct url|url bar|typed the url|entered the url|manual(ly)?\s+went|alternative route|workaround|eventually|after (that|retrying)|results (page|loaded)|landed on)\b/i;

const STRONG_NEGATIVE =
  /\b(404|500|crash(ed)?|broken|doesn't work|didn't work|never loaded|impossible to|blocked completely|error (page|message)|fatal)\b/i;

const FEATURE_TERMS: { term: string; label: string }[] = [
  { term: "search", label: "Search" },
  { term: "login", label: "Login" },
  { term: "sign in", label: "Sign-in" },
  { term: "sign up", label: "Sign-up" },
  { term: "checkout", label: "Checkout" },
  { term: "cart", label: "Cart" },
  { term: "payment", label: "Payment" },
  { term: "filter", label: "Filter" },
  { term: "upload", label: "Upload" },
  { term: "download", label: "Download" },
  { term: "subscribe", label: "Subscribe" },
  { term: "navigation", label: "Navigation" },
  { term: "navigate", label: "Navigation" },
];

function extractFeatureLabel(combined: string): string {
  const t = combined.toLowerCase();
  for (const { term, label } of FEATURE_TERMS) {
    if (t.includes(term)) return label;
  }
  return "Feature";
}

function featureKeywordSet(text: string): Set<string> {
  const t = text.toLowerCase();
  const s = new Set<string>();
  for (const { term } of FEATURE_TERMS) {
    if (t.includes(term)) s.add(term);
  }
  return s;
}

function sameFeature(a: string, b: string): boolean {
  const combined = `${a}\n${b}`;
  // Search / query struggle + URL or results recovery (common SPA / YouTube pattern)
  if (
    /\b(search|query)\b/i.test(combined) &&
    /\b(url|navigate|navigation|results?\b|direct|address bar|typed)\b/i.test(combined)
  ) {
    return true;
  }

  const ka = featureKeywordSet(a);
  const kb = featureKeywordSet(b);
  if (ka.size > 0 && kb.size > 0) {
    for (const k of ka) {
      if (kb.has(k)) return true;
    }
  }
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 4)
    );
  const wa = words(a);
  const wb = words(b);
  let overlap = 0;
  for (const w of wa) {
    if (wb.has(w)) overlap++;
  }
  return overlap >= 2;
}

export function evidenceLooksPositive(text: string): boolean {
  if (!text?.trim()) return false;
  const t = text.toLowerCase();
  if (STRONG_NEGATIVE.test(t) && !RECOVERY_SIGNALS.test(t)) return false;
  return POSITIVE_PHRASES.test(t) || RECOVERY_SIGNALS.test(t);
}

function isRecoverySuccess(item: SessionFeedbackItem): boolean {
  if (item.severity === "positive") return true;
  if (item.category === "like") return true;
  const f = item.feedback;
  if (evidenceLooksPositive(f)) return true;
  if (RECOVERY_SIGNALS.test(f)) return true;
  return false;
}

function isFailureCandidate(item: SessionFeedbackItem): boolean {
  if (item.severity === "positive" || item.category === "like") return false;
  if (evidenceLooksPositive(item.feedback) && !STRONG_NEGATIVE.test(item.feedback)) return false;
  return ["bug", "ux_issue", "confusion", "dislike", "missing_feature", "general"].includes(item.category);
}

function normalizeRootCause(item: SessionFeedbackItem): SessionRootCause {
  const r = item.rootCauseType as SessionRootCause;
  if (r === "system_bug" || r === "ux_friction" || r === "semantic_confusion" || r === "self_correction") {
    return r;
  }
  return "system_bug";
}

/** Mis-tagged praise must not stay as system_bug / ux_friction */
function applyPositiveSemanticGuard(item: SessionFeedbackItem): SessionFeedbackItem {
  const f = item.feedback;
  const rc = normalizeRootCause(item);
  if ((rc === "system_bug" || rc === "ux_friction") && evidenceLooksPositive(f) && !STRONG_NEGATIVE.test(f)) {
    return {
      ...item,
      rootCauseType: "self_correction",
      category: "general",
      severity: "minor",
    };
  }
  return item;
}

function downgradeSeverity(s: string): SessionSeverity {
  if (s === "critical" || s === "major") return "medium";
  if (s === "medium") return "medium";
  return "minor";
}

function buildMergedDescription(
  failure: SessionFeedbackItem,
  recovery: SessionFeedbackItem,
  featureLabel: string
): string {
  const failShort =
    failure.feedback.length > 220 ? failure.feedback.slice(0, 217).trim() + "…" : failure.feedback.trim();
  const okShort =
    recovery.feedback.length > 220 ? recovery.feedback.slice(0, 217).trim() + "…" : recovery.feedback.trim();

  const searchHint =
    /search/i.test(failure.feedback + recovery.feedback) ||
    /search/i.test(featureLabel)
      ? " Consider checking async loading, hydration, and event binding for the primary search entry point (e.g. homepage search button vs. direct results URL)."
      : " Consider verifying the primary interaction path versus alternate routes (e.g. direct URL) for consistency and reliability.";

  return `The user attempted ${featureLabel.toLowerCase()} and initially hit friction (${failShort}). They then completed the task through an alternate path (${okShort}).${searchHint}`;
}

function mergeTitle(featureLabel: string, recovery: SessionFeedbackItem): string {
  const viaUrl = /\burl|navigate|address bar|typed\b/i.test(recovery.feedback);
  const tail = viaUrl ? "User recovered via URL" : "User recovered via alternate path";
  return `Intermittent ${featureLabel} Failure (${tail})`;
}

function toFinding(item: SessionFeedbackItem): AnalyzedFinding | null {
  if (item.severity === "positive" || item.category === "like") return null;

  const rc = normalizeRootCause(item);

  // Reclassified praise — do not surface as an issue row
  if (
    rc === "self_correction" &&
    evidenceLooksPositive(item.feedback) &&
    !STRONG_NEGATIVE.test(item.feedback)
  ) {
    return null;
  }

  let severity = (item.severity as SessionSeverity) || "minor";
  if (severity !== "critical" && severity !== "major" && severity !== "minor" && severity !== "medium") {
    severity = "minor";
  }

  const title = item.feedback.length > 80 ? item.feedback.substring(0, 77) + "…" : item.feedback;

  return {
    category: item.category,
    severity,
    title,
    description: item.feedback,
    pageUrl: item.pageUrl,
    evidence: item.feedback,
    rootCauseType: rc,
  };
}

const MERGE_WINDOW = 3;

/**
 * Post-process ordered feedback for one persona: merge failure→success on the same feature
 * within the next MERGE_WINDOW feedback items, apply positive-evidence guards, and downgrade severity when recovered.
 */
export function analyzeSessionFindings(raw: SessionFeedbackItem[]): AnalyzedFinding[] {
  const items = raw.map(applyPositiveSemanticGuard);
  const n = items.length;
  const used = new Set<number>();
  const out: AnalyzedFinding[] = [];

  for (let i = 0; i < n; i++) {
    if (used.has(i)) continue;
    const a = items[i];

    if (!isFailureCandidate(a)) {
      const f = toFinding(a);
      if (f) out.push(f);
      continue;
    }

    let merged = false;
    const maxJ = Math.min(i + MERGE_WINDOW, n - 1);
    for (let j = i + 1; j <= maxJ; j++) {
      if (used.has(j)) continue;
      const b = items[j];
      if (!isRecoverySuccess(b)) continue;
      if (!sameFeature(a.feedback, b.feedback)) continue;

      const combined = `${a.feedback}\n${b.feedback}`;
      const featureLabel = extractFeatureLabel(combined);
      const title = mergeTitle(featureLabel, b);
      const description = buildMergedDescription(a, b, featureLabel);
      const sev = downgradeSeverity(a.severity);

      out.push({
        category: "ux_issue",
        severity: sev,
        title,
        description,
        pageUrl: a.pageUrl || b.pageUrl,
        evidence: `Before: ${a.feedback.trim()}\nAfter: ${b.feedback.trim()}`,
        rootCauseType: "self_correction",
      });
      used.add(i);
      used.add(j);
      merged = true;
      break;
    }

    if (!merged) {
      const f = toFinding(a);
      if (f) out.push(f);
    }
  }

  return out;
}
