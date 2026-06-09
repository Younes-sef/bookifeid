// ─── Plan Types ──────────────────────────────────────────────────────────────

export type PlanType = "free" | "pro" | "scholar";
export type BillingCycle = "monthly" | "yearly";

// ─── Plan Definitions ────────────────────────────────────────────────────────

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number; // per month when billed annually
  badge?: string;
  badgeColor?: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  accentColor: string;
  bgGradient: string;
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: "free",
    name: "Reader",
    tagline: "Start your journey",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: "Upload up to 3 books", included: true },
      { text: "Text chat with your books", included: true },
      { text: "Basic AI understanding", included: true },
      { text: "3 voice sessions / month", included: true },
      { text: "5 min max per voice session", included: true },
      { text: "Standard response speed", included: true },
      { text: "Priority AI processing", included: false },
      { text: "Unlimited books", included: false },
      { text: "Unlimited voice sessions", included: false },
    ],
    cta: "Get started free",
    accentColor: "#8B7355",
    bgGradient: "linear-gradient(135deg, #f8f4e9 0%, #f3e4c7 100%)",
  },
  pro: {
    id: "pro",
    name: "Scholar",
    tagline: "For serious readers",
    monthlyPrice: 12,
    yearlyPrice: 9,
    badge: "Most Popular",
    popular: true,
    features: [
      { text: "Upload up to 25 books", included: true, highlight: true },
      { text: "Text chat with your books", included: true },
      { text: "Advanced AI understanding", included: true, highlight: true },
      { text: "20 voice sessions / month", included: true, highlight: true },
      { text: "20 min max per voice session", included: true },
      { text: "Priority response speed", included: true, highlight: true },
      { text: "Priority AI processing", included: true, highlight: true },
      { text: "Unlimited books", included: false },
      { text: "Unlimited voice sessions", included: false },
    ],
    cta: "Start 7-day free trial",
    accentColor: "#663820",
    bgGradient: "linear-gradient(135deg, #663820 0%, #7a4528 100%)",
  },
  scholar: {
    id: "scholar",
    name: "Luminary",
    tagline: "Unlimited everything",
    monthlyPrice: 29,
    yearlyPrice: 22,
    badge: "Best Value",
    features: [
      { text: "Unlimited books", included: true, highlight: true },
      { text: "Text chat with your books", included: true },
      { text: "Deepest AI understanding", included: true, highlight: true },
      { text: "Unlimited voice sessions", included: true, highlight: true },
      { text: "60 min max per voice session", included: true, highlight: true },
      { text: "Fastest response speed", included: true, highlight: true },
      { text: "Priority AI processing", included: true, highlight: true },
      { text: "Early access to new features", included: true, highlight: true },
      { text: "Dedicated support", included: true, highlight: true },
    ],
    cta: "Go Luminary",
    accentColor: "#212a3b",
    bgGradient: "linear-gradient(135deg, #212a3b 0%, #3d485e 100%)",
  },
};

export const PLAN_ORDER: PlanType[] = ["free", "pro", "scholar"];

// ─── Limits per plan ─────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: {
    maxBooks: 3,
    maxVoiceSessionsPerMonth: 3,
    maxVoiceSessionDurationMinutes: 5,
  },
  pro: {
    maxBooks: 25,
    maxVoiceSessionsPerMonth: 20,
    maxVoiceSessionDurationMinutes: 20,
  },
  scholar: {
    maxBooks: Infinity,
    maxVoiceSessionsPerMonth: Infinity,
    maxVoiceSessionDurationMinutes: 60,
  },
};
