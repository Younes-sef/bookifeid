"use client";

/**
 * Subscriptions — Pricing page
 *
 * Custom-built interactive pricing UI matching the project's warm literary palette.
 * Features:
 *   - Monthly / Yearly billing toggle with animated pill indicator
 *   - Three plan cards (Reader · Scholar · Luminary) with Framer Motion entrance
 *   - Hover lift + glow effects on cards
 *   - Yearly discount badge animates in when toggled
 *   - Popular card has extra visual prominence
 *   - FAQ accordion at the bottom
 *   - No external payment SDK — simple "contact / sign up" CTA flow
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Zap,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { PLANS, PLAN_ORDER, type BillingCycle } from "@/lib/subscription-constants";
import { createCheckoutSession } from "@/lib/action/stripe.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

// ─── Plan icon map ────────────────────────────────────────────────────────────

const PlanIcon = ({ id }: { id: string }) => {
  if (id === "free") return <BookOpen className="w-6 h-6" />;
  if (id === "pro") return <Zap className="w-6 h-6" />;
  return <GraduationCap className="w-6 h-6" />;
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Can I change my plan later?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences.",
  },
  {
    q: "What happens to my books if I downgrade?",
    a: "Your books remain safe and accessible. If you exceed the new plan's limit, you won't be able to upload new books until you're within the limit, but existing books stay intact.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Scholar plan includes a 7-day free trial — no credit card required to start. You'll only be charged when the trial ends.",
  },
  {
    q: "What file types can I upload?",
    a: "Bookified currently supports PDF files up to 50 MB. Support for ePub and other formats is coming soon.",
  },
  {
    q: "How does voice conversation work?",
    a: "Voice sessions use an AI voice assistant powered by 11Labs and VAPI. You speak your questions and the AI responds with natural speech — like talking to a knowledgeable friend about your book.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. There are no lock-in contracts. Cancel anytime from your account settings and you'll keep access until the end of your billing period.",
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="faq-item"
    >
      <button
        className="faq-question"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        id={`faq-btn-${index}`}
      >
        <span className="font-semibold text-[#212a3b] text-left">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#8B7355]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="faq-answer">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const { isSignedIn } = useUser();

  const handleCheckout = async (planId: "pro" | "scholar") => {
    try {
      setIsCheckingOut(planId);
      const res = await createCheckoutSession(planId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      toast.error("An error occurred during checkout");
    } finally {
      setIsCheckingOut(null);
    }
  };

  const yearlyActive = billing === "yearly";
  const yearlySavingPct = 25; // average saving

  return (
    <div className="min-h-screen bg-[#f8f4e9] overflow-x-hidden">
      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <section className="pricing-hero">
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #e3c99a 0%, transparent 70%)", transform: "translate(30%, -20%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #d4a853 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
        />

        <div className="wrapper relative z-10 text-center">
          {/* Badge */}
          <motion.div
            custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2 bg-white border border-[#e8dcc8] rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-[#663820]"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple, transparent pricing</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="font-serif text-4xl md:text-5xl lg:text-[56px] font-bold text-[#212a3b] leading-[1.1] tracking-tight mb-4"
          >
            Choose your reading plan
          </motion.h1>

          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-lg text-[#3d485e] mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Start free and upgrade when you're ready. Every plan includes text chat, AI understanding, and voice conversations.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            custom={3} variants={fadeUp} initial="hidden" animate="visible"
            className="billing-toggle-wrapper"
          >
            <button
              id="billing-monthly-btn"
              className={`billing-toggle-option ${!yearlyActive ? "billing-toggle-active" : "billing-toggle-inactive"}`}
              onClick={() => setBilling("monthly")}
            >
              Monthly
            </button>

            {/* Animated sliding pill */}
            <div className="billing-toggle-track">
              <motion.div
                className="billing-toggle-pill"
                layout
                animate={{ x: yearlyActive ? "100%" : "0%" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            </div>

            <button
              id="billing-yearly-btn"
              className={`billing-toggle-option ${yearlyActive ? "billing-toggle-active" : "billing-toggle-inactive"}`}
              onClick={() => setBilling("yearly")}
            >
              Yearly
              <AnimatePresence>
                {yearlyActive && (
                  <motion.span
                    key="badge"
                    initial={{ opacity: 0, scale: 0.7, x: 6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.7, x: 6 }}
                    transition={{ duration: 0.2 }}
                    className="billing-save-badge"
                  >
                    Save {yearlySavingPct}%
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING CARDS ───────────────────────────────────────────────── */}
      <section className="pricing-cards-section">
        <div className="wrapper">
          <div className="pricing-grid">
            {PLAN_ORDER.map((planId, i) => {
              const plan = PLANS[planId];
              const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const isFree = price === 0;
              const isPopular = plan.popular;

              return (
                <motion.div
                  key={plan.id}
                  custom={i}
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  className={`pricing-card ${isPopular ? "pricing-card-popular" : ""}`}
                  id={`plan-card-${plan.id}`}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div
                      className="pricing-badge"
                      style={{
                        background: isPopular
                          ? "linear-gradient(135deg, #663820, #7a4528)"
                          : "#212a3b",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Card header */}
                  <div className={`pricing-card-header ${isPopular ? "pricing-card-header-popular" : ""}`}>
                    {/* Icon */}
                    <div
                      className="pricing-icon-wrap"
                      style={{
                        background: isPopular ? "rgba(255,255,255,0.15)" : "#f3e4c7",
                        color: isPopular ? "white" : plan.accentColor,
                      }}
                    >
                      <PlanIcon id={plan.id} />
                    </div>

                    <div>
                      <h2
                        className="pricing-plan-name"
                        style={{ color: isPopular ? "white" : "#212a3b" }}
                      >
                        {plan.name}
                      </h2>
                      <p
                        className="pricing-plan-tagline"
                        style={{ color: isPopular ? "rgba(255,255,255,0.75)" : "#8B7355" }}
                      >
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Price display */}
                  <div className="pricing-price-block">
                    <div className="flex items-end gap-1">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${plan.id}-${billing}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="pricing-price-amount"
                          style={{ color: isPopular ? "#663820" : "#212a3b" }}
                        >
                          {isFree ? "Free" : `$${price}`}
                        </motion.span>
                      </AnimatePresence>
                      {!isFree && (
                        <span className="pricing-price-period">/ mo</span>
                      )}
                    </div>
                    {!isFree && billing === "yearly" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pricing-billed-yearly"
                      >
                        Billed ${price * 12}/year
                      </motion.p>
                    )}
                    {!isFree && billing === "monthly" && (
                      <p className="pricing-billed-yearly opacity-0 select-none">
                        &nbsp;
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div
                    className="pricing-divider"
                    style={{ background: isPopular ? "rgba(255,255,255,0.15)" : "rgba(33,42,59,0.08)" }}
                  />

                  {/* Features */}
                  <ul className="pricing-features-list">
                    {plan.features.map((f, fi) => (
                      <li
                        key={fi}
                        className={`pricing-feature-item ${!f.included ? "opacity-45" : ""}`}
                      >
                        <span
                          className={`pricing-feature-icon ${f.included ? "pricing-feature-icon-yes" : "pricing-feature-icon-no"}`}
                          style={{
                            background: f.included
                              ? isPopular
                                ? "rgba(255,255,255,0.2)"
                                : "#f3e4c7"
                              : "rgba(0,0,0,0.06)",
                          }}
                        >
                          {f.included ? (
                            <Check
                              className="w-3.5 h-3.5"
                              style={{ color: isPopular ? "white" : plan.accentColor }}
                            />
                          ) : (
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </span>
                        <span
                          className={`text-sm leading-5 ${f.highlight && f.included ? "font-semibold" : "font-normal"}`}
                          style={{
                            color: isPopular
                              ? f.included ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)"
                              : f.included ? "#212a3b" : "#8B7355",
                          }}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="mt-auto pt-6">
                    {isFree ? (
                      isSignedIn ? (
                        <Link
                          href="/dashboard"
                          id={`plan-cta-${plan.id}`}
                          className="pricing-cta-btn pricing-cta-secondary"
                        >
                          Your current plan
                        </Link>
                      ) : (
                        <SignUpButton>
                          <button
                            id={`plan-cta-${plan.id}`}
                            className="pricing-cta-btn pricing-cta-secondary"
                          >
                            {plan.cta}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </SignUpButton>
                      )
                    ) : (
                      isSignedIn ? (
                        <button
                          id={`plan-cta-${plan.id}`}
                          className={`pricing-cta-btn ${isPopular ? "pricing-cta-primary-popular" : "pricing-cta-primary"}`}
                          onClick={() => handleCheckout(plan.id as "pro" | "scholar")}
                          disabled={isCheckingOut === plan.id}
                        >
                          {isCheckingOut === plan.id ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : (
                            <>
                              {plan.cta}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      ) : (
                        <SignUpButton>
                          <button
                            id={`plan-cta-${plan.id}`}
                            className={`pricing-cta-btn ${isPopular ? "pricing-cta-primary-popular" : "pricing-cta-primary"}`}
                          >
                            {plan.cta}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </SignUpButton>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARISON HINT ─────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="py-6 text-center"
      >
        <p className="text-sm text-[#8B7355]">
          All plans include text chat, AI book understanding, and voice conversations.{" "}
          <span className="font-medium text-[#663820]">No hidden fees.</span>
        </p>
      </motion.section>

      {/* ── FAQ SECTION ─────────────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="wrapper max-w-2xl">
          <motion.div
            className="text-center mb-12"
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-[#663820] font-semibold text-sm uppercase tracking-widest mb-3">
              Got questions?
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#212a3b]">
              Frequently asked
            </h2>
          </motion.div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="wrapper">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="landing-cta-section"
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", transform: "translate(30%,-30%)" }}
            />
            <div className="relative z-10">
              <BookOpen className="w-12 h-12 text-[#d4a853] mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                Start reading smarter today
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                Join thousands of readers unlocking the full potential of their books. Free to start, no credit card needed.
              </p>
              <SignUpButton>
                <button
                  id="pricing-final-cta-btn"
                  className="inline-flex items-center gap-2 bg-[#663820] hover:bg-[#7a4528] text-white font-bold px-8 py-4 rounded-[10px] text-lg transition-all"
                  style={{ fontFamily: "'IBM Plex Serif', serif", boxShadow: "0 4px 24px rgba(102,56,32,0.5)" }}
                >
                  Create your free library
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>
              <p className="mt-4 text-white/50 text-sm">
                No credit card required · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
