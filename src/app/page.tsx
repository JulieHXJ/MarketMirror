"use client";

import { useState } from "react";
import { UrlInputForm } from "@/components/forms/UrlInputForm";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { evaluateWebsite } from "./actions/evaluate";
import { AnalysisResult } from "@/types/analysis";

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentUrl(url);

    try {
      const result = await evaluateWebsite(url);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch or analyze the website. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // MOCK DATA FOR UI TESTING
  // Uncomment the line below to immediately render the dashboard with mock data
  // if (!analysis) setAnalysis(mockData); setCurrentUrl("https://example.com");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AuditAI
            </span>
          </div>
          <nav className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Intelligence Platform
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Hero Section */}
        {!analysis && !isLoading && (
          <div className="text-center max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              We don't just analyze how your website looks.
              <br />
              <span className="text-blue-600">We analyze whether it works.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Get an instant AI-powered product intelligence report covering UX, Conversion, Business Logic, and Growth Potential.
            </p>
          </div>
        )}

        {/* Input Form (always visible at top when result is there, or centered otherwise) */}
        <div className={`transition-all duration-500 ${analysis || isLoading ? 'mb-12' : 'mt-8'}`}>
          <UrlInputForm onSubmit={handleAudit} />
        </div>

        {/* App States */}
        {isLoading && <LoadingState />}
        
        {error && !isLoading && (
          <ErrorState error={error} onRetry={() => setError(null)} />
        )}

        {analysis && !isLoading && !error && (
          <DashboardView analysis={analysis} url={currentUrl} />
        )}
      </main>
    </div>
  );
}

const mockData: AnalysisResult = {
  website_type: "SaaS",
  scores: {
    design: 7.2,
    ux: 6.4,
    conversion: 4.9,
    business_logic: 5.8,
    growth: 3.7
  },
  overall_score: 5.8,
  roles: [
    {
      role: "Elderly User",
      overallScore: 4.5,
      tags: ["Readability", "Clarity", "Cognitive Load"],
      summary: "Struggles with contrast and small typography, creating high cognitive load.",
      criticalInsights: "The page likely overloads older users with too many simultaneous visual choices and subtle contrast patterns that fail WCAG standards.",
      breakdown: [
        { category: "Readability", score: 4.0 },
        { category: "Button Clarity", score: 5.5 },
        { category: "Navigation Simplicity", score: 5.0 },
        { category: "Cognitive Load", score: 3.5 },
        { category: "Accessibility Friendliness", score: 4.5 }
      ],
      problems: [
        {
          title: "Low contrast text",
          impact: "High",
          description: "Secondary text falls below WCAG AAA guidelines, making it difficult to read.",
          fix: "Increase text contrast ratio to at least 4.5:1."
        },
        {
          title: "Hidden navigation",
          impact: "Medium",
          description: "Hamburger menu hides critical links on larger tablets.",
          fix: "Keep primary navigation links visible without requiring clicks."
        }
      ],
      recommendations: [
        "Bump minimum body font size to 16px.",
        "Add explicit 'click here' visual cues to buttons.",
        "Remove low-contrast grey-on-grey text treatments."
      ]
    },
    {
      role: "Legal Reviewer",
      overallScore: 6.5,
      tags: ["Compliance Risk", "Policy Gaps", "Trust Signals"],
      summary: "Privacy policy is accessible, but compliance indicators on conversion points are missing.",
      criticalInsights: "The site presents business claims without sufficiently visible legal or compliance context, creating a small but unnecessary risk exposure.",
      breakdown: [
        { category: "Policy Visibility", score: 8.0 },
        { category: "Compliance Signals", score: 4.5 },
        { category: "Misleading Claims Risk", score: 6.5 },
        { category: "Pricing Transparency", score: 5.5 },
        { category: "Trust Documentation", score: 8.0 }
      ],
      problems: [
        {
          title: "Missing cookie consent explicit opt-out",
          impact: "Medium",
          description: "The cookie banner allows acceptance but hides the reject option in a submenu.",
          fix: "Add an explicit 'Reject All' button on the first layer of the cookie banner."
        },
        {
          title: "No Terms checkbox on signup",
          impact: "High",
          description: "Users can create an account without explicitly agreeing to the Terms of Service.",
          fix: "Add a mandatory checkbox or clear 'By signing up you agree...' text near the CTA."
        }
      ],
      recommendations: [
        "Update the copyright year in the footer.",
        "Ensure the GDPR policy link is visible on the signup form."
      ]
    },
    {
      role: "Product Manager",
      overallScore: 5.5,
      tags: ["Flow Friction", "Goal Focus", "Action Hierarchy"],
      summary: "User flow contains unnecessary friction during onboarding and scattered action hierarchies.",
      criticalInsights: "The page communicates features but fails to guide users toward one dominant next step, resulting in decision paralysis.",
      breakdown: [
        { category: "User Journey Clarity", score: 6.0 },
        { category: "Flow Friction", score: 4.5 },
        { category: "Goal Focus", score: 5.0 },
        { category: "Action Hierarchy", score: 5.5 },
        { category: "Onboarding Logic", score: 6.5 }
      ],
      problems: [
        {
          title: "7-Step Signup Form",
          impact: "High",
          description: "Asking for company size and phone number before letting the user see the product creates massive drop-off.",
          fix: "Use progressive profiling. Only ask for email and password upfront."
        },
        {
          title: "Competing primary CTAs",
          impact: "Medium",
          description: "'Start Trial' and 'Book Demo' carry the exact same visual weight.",
          fix: "Choose one primary action for the solid button, make the other an outline/ghost button."
        }
      ],
      recommendations: [
        "Add a progress bar to the onboarding flow.",
        "Introduce a 'magic link' or Google SSO login option.",
        "Clarify the 'Aha moment' earlier in the funnel."
      ]
    },
    {
      role: "Industry Practitioner",
      overallScore: 6.1,
      tags: ["Business Fit", "Industry Alignment", "Structure Gaps"],
      summary: "Lacks advanced feature details and deep technical alignment expected by enterprise buyers.",
      criticalInsights: "The structure suggests category awareness, but the commercial journey lacks expected depth for serious B2B evaluation.",
      breakdown: [
        { category: "Business Structure Alignment", score: 6.5 },
        { category: "Industry Convention Fit", score: 7.0 },
        { category: "Feature Completeness", score: 5.0 },
        { category: "Pricing Logic", score: 6.8 },
        { category: "Operational Credibility", score: 5.2 }
      ],
      problems: [
        {
          title: "Missing API Documentation Link",
          impact: "High",
          description: "Technical buyers cannot find how to integrate the product into their existing stack.",
          fix: "Add a prominent 'Developers' or 'API' section in the top navigation or footer."
        }
      ],
      recommendations: [
        "Create a dedicated page comparing the product to industry alternatives.",
        "Highlight enterprise security features like SOC2.",
        "Add case studies showing technical implementation."
      ]
    },
    {
      role: "Investor",
      overallScore: 4.8,
      tags: ["Monetization Logic", "Market Readiness", "Credibility"],
      summary: "Interesting product premise, but monetization paths and scalability signals are poorly defined.",
      criticalInsights: "The product story is interesting, but the business maturity signals remain weak for early conviction. The 'Why Now' and 'Why Us' narratives are missing.",
      breakdown: [
        { category: "Monetization Logic", score: 4.5 },
        { category: "Market Readiness", score: 5.5 },
        { category: "Business Credibility", score: 4.0 },
        { category: "Scalability Signals", score: 5.0 },
        { category: "Execution Maturity", score: 5.0 }
      ],
      problems: [
        {
          title: "No clear 'Enterprise' tier up-sell",
          impact: "High",
          description: "Pricing stops at a low monthly tier, showing no clear path to capture high-ACV customers.",
          fix: "Add a 'Custom/Enterprise' tier with 'Contact Sales' to signal upmarket capability."
        },
        {
          title: "Weak team/company signaling",
          impact: "Medium",
          description: "There is no 'About Us' or team credibility page, making the company feel like a hobby project.",
          fix: "Add an 'About' page detailing the founders' background and company mission."
        }
      ],
      recommendations: [
        "Clarify the exact target market on the hero (e.g. 'For B2B Sales Teams').",
        "Add logos of current customers or pilot partners.",
        "Make the monetization strategy explicit."
      ]
    }
  ],
  summary: "This website has solid visual structure but weak conversion logic and limited growth mechanisms.",
  main_problems: [
    {
      title: "Primary CTA is unclear",
      impact: "High",
      description: "Users may not know the main next step after landing on the homepage. There are multiple competing buttons with equal visual weight.",
      suggested_fix: "Make one primary action visually dominant above the fold."
    },
    {
      title: "Missing Trust Signals",
      impact: "Medium",
      description: "There are no customer logos, testimonials, or security badges visible before scrolling.",
      suggested_fix: "Add a 'Trusted by' logo band immediately below the hero section."
    },
    {
      title: "Complex Onboarding",
      impact: "High",
      description: "The signup flow requires too much information upfront.",
      suggested_fix: "Implement progressive profiling. Just ask for email/password first."
    }
  ],
  quick_wins: [
    "Clarify the headline value proposition",
    "Add a primary CTA above the fold",
    "Reduce signup friction",
    "Add trust signals",
    "Improve pricing visibility"
  ],
  conversion_funnel_analysis: { detected_flow: [], problems: [] },
  business_logic_analysis: { missing_elements: [], structural_problems: [] },
  growth_analysis: { missing_growth_features: [], opportunities: [] }
};
