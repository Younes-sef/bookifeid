"use client";

/**
 * LandingPage — Public-facing marketing page
 *
 * Shown to unauthenticated users at the root URL (/).
 * Uses Framer Motion for:
 *   - Staggered text entrance on the hero (fade up)
 *   - Floating animation on the hero illustration
 *   - Scroll-triggered animations on feature & step cards
 *   - Hover lift effects on cards
 *
 * The design uses the same warm literary palette as the rest of the app:
 *   bg: #f8f4e9 / #f3e4c7, text: #212a3b, brand: #663820
 */

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  BookOpen,
  BrainCircuit,
  Mic,
  Upload,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";
import { SignUpButton, SignInButton } from "@clerk/nextjs";

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const floatAnimation = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Upload Any Book",
    description:
      "Drop any PDF into Bookified. Our engine reads, indexes, and understands your book's full content in seconds.",
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "AI-Powered Understanding",
    description:
      "Google's Gemini AI analyzes your book chapter by chapter — ready to answer questions, explain concepts, and surface insights.",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Conversations",
    description:
      "Talk to your books out loud. Ask questions and get spoken answers — like having a conversation with the author.",
  },
];

const steps = [
  {
    num: "1",
    title: "Upload your PDF",
    description: "Add any book, textbook, or research paper from your device.",
  },
  {
    num: "2",
    title: "AI reads it",
    description:
      "Our engine segments and indexes every page so the AI truly understands it.",
  },
  {
    num: "3",
    title: "Chat or speak",
    description:
      "Ask questions in text or by voice and get accurate, contextual answers.",
  },
];

const testimonials = [
  {
    quote:
      "I finished my thesis faster because I could ask my 400-page reference book questions instead of skimming it.",
    name: "Yasmine K.",
    role: "Graduate student",
  },
  {
    quote:
      "Finally a tool that actually reads the book. The answers are always grounded in the actual text.",
    name: "Marcus R.",
    role: "Software engineer",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#f8f4e9] overflow-x-hidden">
      {/* ════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════ */}
      <section className="landing-hero">
        {/* Decorative background circles */}
        <div
          className="absolute top-1/4 -right-24 w-72 h-72 rounded-full opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #e3c99a 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/4 -left-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #d4a853 0%, transparent 70%)",
          }}
        />

        <div className="wrapper w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-16 md:py-20">
          {/* Left — Text content */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            {/* Badge */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 bg-white border border-[#e8dcc8] rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-[#663820]"
              style={{ boxShadow: "var(--shadow-soft-sm)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Book Conversations</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-serif text-5xl md:text-6xl lg:text-[64px] font-bold text-[#212a3b] leading-[1.1] tracking-tight mb-5"
            >
              Your books,{" "}
              <span className="text-[#663820]">alive</span>{" "}
              with AI
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-[#3d485e] leading-relaxed mb-8"
            >
              Upload any PDF and turn it into an interactive conversation.
              Ask questions, get summaries, and discuss ideas — by text or
              by voice.
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <SignUpButton>
                <button
                  id="landing-signup-btn"
                  className="flex items-center justify-center gap-2 bg-[#663820] hover:bg-[#7a4528] text-white font-bold px-7 py-3.5 rounded-[10px] text-lg transition-all"
                  style={{ fontFamily: "'IBM Plex Serif', serif" }}
                >
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>

              <SignInButton>
                <button
                  id="landing-signin-btn"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#212a3b] font-semibold px-7 py-3.5 rounded-[10px] text-lg transition-all border border-[#e8dcc8]"
                  style={{ boxShadow: "var(--shadow-soft-sm)" }}
                >
                  Sign in
                </button>
              </SignInButton>
            </motion.div>

            {/* Social proof pill */}
            <motion.p
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-5 text-sm text-[#8B7355] flex items-center gap-1.5 justify-center lg:justify-start"
            >
              <Star className="w-4 h-4 fill-[#d4a853] text-[#d4a853]" />
              <Star className="w-4 h-4 fill-[#d4a853] text-[#d4a853]" />
              <Star className="w-4 h-4 fill-[#d4a853] text-[#d4a853]" />
              <Star className="w-4 h-4 fill-[#d4a853] text-[#d4a853]" />
              <Star className="w-4 h-4 fill-[#d4a853] text-[#d4a853]" />
              <span className="ml-1 font-medium text-[#3d485e]">
                Loved by readers and researchers
              </span>
            </motion.p>
          </div>

          {/* Right — Floating illustration */}
          <motion.div
            className="flex-1 flex items-center justify-center"
            variants={floatAnimation}
            animate="animate"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src="/assets/hero-illustration.png"
                alt="Books and globe illustration"
                width={480}
                height={480}
                className="object-contain drop-shadow-xl"
                priority
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-[#8B7355] font-medium tracking-widest uppercase">
            Discover more
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-5 flex items-center justify-center text-[#8B7355]"
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURES SECTION
          ════════════════════════════════════════════ */}
      <section className="landing-section bg-white">
        <div className="wrapper">
          {/* Section header */}
          <motion.div
            className="text-center mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-[#663820] font-semibold text-sm uppercase tracking-widest mb-3">
              What Bookified does
            </p>
            <h2 className="section-title text-3xl md:text-4xl font-serif font-bold text-[#212a3b]">
              Everything your library needs
            </h2>
            <p className="subtitle mt-3 max-w-xl mx-auto text-[#3d485e]">
              Three powerful capabilities in one beautiful, distraction-free
              experience.
            </p>
          </motion.div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="landing-feature-card"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
              >
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="text-xl font-bold text-[#212a3b] font-serif">
                  {f.title}
                </h3>
                <p className="text-[#3d485e] leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS SECTION
          ════════════════════════════════════════════ */}
      <section className="landing-section" style={{ background: "#f3e4c7" }}>
        <div className="wrapper">
          <motion.div
            className="text-center mb-14"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-[#663820] font-semibold text-sm uppercase tracking-widest mb-3">
              Simple process
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#212a3b]">
              From PDF to conversation in 3 steps
            </h2>
          </motion.div>

          {/* Steps */}
          <div className="flex flex-col max-w-2xl mx-auto gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                className="flex items-start gap-6 relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute left-5 top-12 w-0.5 bg-[#d4a853] opacity-40"
                    style={{ height: "calc(100% - 12px)" }}
                  />
                )}

                <div className="landing-step-pill z-10 bg-[#f8f4e9]">
                  {step.num}
                </div>

                <div
                  className="flex-1 bg-white rounded-2xl p-6 mb-5"
                  style={{ boxShadow: "var(--shadow-soft-sm)" }}
                >
                  <h3 className="text-xl font-bold text-[#212a3b] mb-1 font-serif">
                    {step.title}
                  </h3>
                  <p className="text-[#3d485e] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TESTIMONIALS SECTION
          ════════════════════════════════════════════ */}
      <section className="landing-section bg-white">
        <div className="wrapper">
          <motion.div
            className="text-center mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <p className="text-[#663820] font-semibold text-sm uppercase tracking-widest mb-3">
              From our readers
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#212a3b]">
              What people are saying
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                className="landing-quote-card"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-[#d4a853] text-[#d4a853]"
                    />
                  ))}
                </div>
                <blockquote className="text-[#212a3b] text-lg leading-relaxed italic font-serif mb-5">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="font-bold text-[#212a3b]">{t.name}</p>
                  <p className="text-sm text-[#8B7355]">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FINAL CTA SECTION
          ════════════════════════════════════════════ */}
      <section className="landing-section bg-[#f8f4e9]">
        <div className="wrapper">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="landing-cta-section"
          >
            {/* Decorative circles */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #ffffff 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #ffffff 0%, transparent 70%)",
                transform: "translate(-30%, 30%)",
              }}
            />

            <div className="relative z-10">
              <BookOpen className="w-12 h-12 text-[#d4a853] mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                Start reading smarter today
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
                Join readers who are unlocking the full potential of their
                books with AI. It&apos;s free to get started.
              </p>

              <SignUpButton>
                <button
                  id="landing-final-cta-btn"
                  className="inline-flex items-center gap-2 bg-[#663820] hover:bg-[#7a4528] text-white font-bold px-8 py-4 rounded-[10px] text-lg transition-all"
                  style={{
                    fontFamily: "'IBM Plex Serif', serif",
                    boxShadow: "0 4px 24px rgba(102, 56, 32, 0.5)",
                  }}
                >
                  Create your free library
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>

              <p className="mt-4 text-white/50 text-sm">
                No credit card required • Upload your first book in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════ */}
      <footer className="py-8 border-t border-[#e8dcc8] bg-[#f8f4e9]">
        <div className="wrapper flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5">
            <Image
              src="/assets/logo.png"
              alt="Bookified"
              width={32}
              height={20}
            />
            <span className="font-bold text-[#212a3b] font-serif">
              Bookified
            </span>
          </Link>
          <p className="text-sm text-[#8B7355]">
            © {new Date().getFullYear()} Bookified. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
