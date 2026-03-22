export type WebsiteType =
  | "SaaS"
  | "Ecommerce"
  | "Marketplace"
  | "Booking"
  | "Portfolio"
  | "Content site"
  | "App landing page"
  | "Other";

export interface AnalysisScores {
  design: number;
  ux: number;
  conversion: number;
  business_logic: number;
  growth: number;
}

export interface RoleAnalysis {
  role: string;
  overallScore: number;
  tags: string[];
  summary: string;
  breakdown: {
    category: string;
    score: number;
  }[];
  criticalInsights: string;
  problems: {
    title: string;
    impact: "High" | "Medium" | "Low";
    description: string;
    fix: string;
  }[];
  recommendations: string[];
}

export interface MainProblem {
  title: string;
  impact: "High" | "Medium" | "Low";
  description: string;
  suggested_fix: string;
}

export interface ConversionFunnelAnalysis {
  detected_flow: string[];
  problems: string[];
}

export interface BusinessLogicAnalysis {
  missing_elements: string[];
  structural_problems: string[];
}

export interface GrowthAnalysis {
  missing_growth_features: string[];
  opportunities: string[];
}

export interface AnalysisResult {
  website_type: WebsiteType;
  scores: AnalysisScores;
  overall_score: number;
  roles: RoleAnalysis[];
  summary: string;
  main_problems: MainProblem[];
  conversion_funnel_analysis: ConversionFunnelAnalysis;
  business_logic_analysis: BusinessLogicAnalysis;
  growth_analysis: GrowthAnalysis;
  quick_wins: string[];
}
