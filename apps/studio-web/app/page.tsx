import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Studio — AI-powered UX design for serious teams",
  description:
    "Generate page blueprints, run 38-point heuristic audits, and export production-ready design specs. Built for senior UX designers and PMs.",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PIPELINE = [
  {
    step: "01",
    label: "Brief",
    description:
      "Describe your product: name, tone, audience, constraints. Templates for SaaS, e-commerce, agencies, and more.",
  },
  {
    step: "02",
    label: "Blueprint",
    description:
      "AI generates a structured page blueprint — sections, copy hierarchy, theme tokens — with Anthropic or local Ollama.",
  },
  {
    step: "03",
    label: "Audit",
    description:
      "38-point heuristic engine checks WCAG contrast, Flesch-Kincaid readability, landmark regions, CTA presence, and more. Zero LLM.",
  },
  {
    step: "04",
    label: "Export",
    description:
      "Download the blueprint as JSON, CSS design tokens, a full HTML preview, or a ZIP bundle — ready for handoff.",
  },
];

const FEATURES = [
  {
    icon: "⚡",
    label: "AI Blueprint Generation",
    detail:
      "Anthropic Claude first, local Ollama fallback, deterministic mock last. Never blocks on API availability.",
  },
  {
    icon: "🎯",
    label: "Real Heuristic Audit",
    detail:
      "38 checks across accessibility, readability, and performance. Powered by Cheerio HTML parsing — not an LLM guess.",
  },
  {
    icon: "🎨",
    label: "Tone-driven Theme Engine",
    detail:
      "Six tones (professional, bold, minimal, playful, friendly, …) each generate three palette presets with full CSS variable output.",
  },
  {
    icon: "📐",
    label: "Live Preview Pane",
    detail:
      "Sandboxed iframe with Desktop / Tablet / Mobile viewports. ResizeObserver scaling so you see the real layout at any size.",
  },
  {
    icon: "⌘",
    label: "Command Palette",
    detail:
      "⌘K spotlight with fuzzy matching across actions, templates, and recent runs. Every workflow is one keystroke away.",
  },
  {
    icon: "📦",
    label: "Structured Exports",
    detail:
      "JSON blueprint, CSS tokens, full HTML page, or a client-side ZIP. No server round-trip for export — pure browser.",
  },
];

const USE_CASES = [
  {
    title: "SaaS Product Launch",
    description:
      "Generate a conversion-optimised landing page blueprint with feature sections, social proof, pricing hierarchy, and CTA scaffolding.",
    tag: "Conversion",
  },
  {
    title: "E-Commerce Storefronts",
    description:
      "Audit product pages for trust signals, image alt coverage, form label compliance, and mobile viewport readiness.",
    tag: "Compliance",
  },
  {
    title: "Agency Proposals",
    description:
      "Produce a polished page brief for client review — with audit scores pre-run so you walk in with data, not assumptions.",
    tag: "Client Work",
  },
  {
    title: "Consumer Apps",
    description:
      "Validate onboarding flows against readability scores and WCAG 2.1 AA contrast ratios before a single pixel is designed.",
    tag: "Accessibility",
  },
  {
    title: "Developer Tools",
    description:
      "Blueprint documentation sites and marketing pages with a minimal tone, then export CSS tokens directly into your design system.",
    tag: "Design Systems",
  },
  {
    title: "Marketplace Platforms",
    description:
      "Stress-test complex multi-role pages for heading structure, landmark regions, and skip-link compliance at scale.",
    tag: "WCAG Audit",
  },
];

const AUDIT_CHECKS = [
  "WCAG AA color contrast",
  "Flesch-Kincaid reading ease",
  "Skip navigation link",
  "Positive tabindex values",
  "Mobile viewport meta",
  "Landmark completeness",
  "CTA presence",
  "Trust signals",
  "Open Graph tags",
  "Render-blocking scripts",
  "Image lazy loading",
  "Focus outline suppression",
];

// ─── Components ───────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10"
      style={{
        height: 56,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: "var(--color-ps-ink)" }}
      >
        Product Studio
      </span>
      <div className="flex items-center gap-5">
        <a
          href="#features"
          className="text-[12px] transition-opacity hover:opacity-100 opacity-60"
          style={{ color: "var(--color-ps-ink)" }}
        >
          Features
        </a>
        <a
          href="#use-cases"
          className="text-[12px] transition-opacity hover:opacity-100 opacity-60"
          style={{ color: "var(--color-ps-ink)" }}
        >
          Use Cases
        </a>
        <Link
          href="/studio"
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-90"
          style={{
            background: "var(--color-ps-accent)",
            color: "#fff",
          }}
        >
          Open Studio
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "100svh", paddingTop: 56 }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div
        className="mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest"
        style={{
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.25)",
          color: "rgba(165,180,252,0.9)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "rgba(165,180,252,0.9)" }}
        />
        38-point heuristic audit engine
      </div>

      {/* Headline */}
      <h1
        className="mx-auto max-w-3xl text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.05] tracking-tight"
        style={{ color: "var(--color-ps-ink)" }}
      >
        The AI-powered UX studio
        <br />
        <span style={{ color: "var(--color-ps-accent-light, #a5b4fc)" }}>
          for teams that ship.
        </span>
      </h1>

      {/* Sub */}
      <p
        className="mx-auto mt-6 max-w-xl text-[1rem] leading-relaxed"
        style={{ color: "var(--color-ps-ink-dim)" }}
      >
        Generate structured page blueprints with AI, audit against real WCAG
        heuristics, and export production-ready design specs — without leaving
        the browser.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/studio"
          className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--color-ps-accent)",
            color: "#fff",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.3)",
          }}
        >
          Open Studio
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium transition-opacity hover:opacity-100 opacity-80"
          style={{
            background: "var(--color-ps-raised)",
            border: "1px solid var(--color-ps-border)",
            color: "var(--color-ps-ink)",
          }}
        >
          See how it works
        </a>
      </div>

      {/* Score preview strip */}
      <div
        className="mx-auto mt-16 flex items-center gap-6 rounded-2xl px-8 py-4"
        style={{
          background: "var(--color-ps-surface)",
          border: "1px solid var(--color-ps-border)",
        }}
      >
        {[
          { label: "Accessibility", score: 94 },
          { label: "Readability", score: 87 },
          { label: "Performance", score: 91 },
          { label: "Overall", score: 91 },
        ].map(({ label, score }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span
              className="text-[22px] font-bold tabular-nums"
              style={{ color: score >= 90 ? "#4ade80" : score >= 70 ? "#facc15" : "#f87171" }}
            >
              {score}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--color-ps-ink-ghost)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pipeline() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
      <SectionLabel>How it works</SectionLabel>
      <h2
        className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight"
        style={{ color: "var(--color-ps-ink)" }}
      >
        Four stages. One browser tab.
      </h2>

      <div className="mt-12 grid gap-0 md:grid-cols-4">
        {PIPELINE.map((item, i) => (
          <div key={item.step} className="relative flex flex-col gap-3 p-6">
            {/* Connector line */}
            {i < PIPELINE.length - 1 && (
              <div
                className="absolute right-0 top-9 hidden md:block h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-ps-border) 0%, transparent 100%)",
                  width: "calc(100% - 3rem)",
                  left: "calc(3rem + 12px)",
                }}
              />
            )}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-bold"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "rgba(165,180,252,0.9)",
              }}
            >
              {item.step}
            </div>
            <h3
              className="text-[15px] font-semibold"
              style={{ color: "var(--color-ps-ink)" }}
            >
              {item.label}
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-24" style={{ background: "var(--color-ps-surface)" }}>
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Features</SectionLabel>
        <h2
          className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight"
          style={{ color: "var(--color-ps-ink)" }}
        >
          Everything a senior designer needs.
          <br />
          <span style={{ color: "var(--color-ps-ink-dim)" }}>Nothing they don't.</span>
        </h2>

        <div className="mt-12 grid gap-px md:grid-cols-3" style={{ background: "var(--color-ps-border)" }}>
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-3 p-7"
              style={{ background: "var(--color-ps-surface)" }}
            >
              <span className="text-[24px]">{f.icon}</span>
              <h3
                className="text-[14px] font-semibold"
                style={{ color: "var(--color-ps-ink)" }}
              >
                {f.label}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditEngine() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="grid gap-12 md:grid-cols-2 items-center">
        <div>
          <SectionLabel>Audit Engine</SectionLabel>
          <h2
            className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight leading-snug"
            style={{ color: "var(--color-ps-ink)" }}
          >
            38 heuristic checks.
            <br />Zero LLM hallucination.
          </h2>
          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ color: "var(--color-ps-ink-dim)" }}
          >
            Every audit finding is backed by a deterministic HTML parse —
            Cheerio, WCAG 2.1 luminance math, and Flesch-Kincaid scoring.
            No AI guesswork. Every result is reproducible.
          </p>
          <Link
            href="/studio"
            className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-80"
            style={{ color: "rgba(165,180,252,0.9)" }}
          >
            Run your first audit →
          </Link>
        </div>

        {/* Check list */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--color-ps-surface)",
            border: "1px solid var(--color-ps-border)",
          }}
        >
          <p
            className="mb-4 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            Sample checks
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AUDIT_CHECKS.map((check) => (
              <div
                key={check}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
                style={{
                  background: "var(--color-ps-raised)",
                  color: "var(--color-ps-ink-dim)",
                }}
              >
                <span style={{ color: "#4ade80" }}>✓</span>
                {check}
              </div>
            ))}
          </div>
          <p
            className="mt-4 text-[11px] text-center"
            style={{ color: "var(--color-ps-ink-ghost)" }}
          >
            +26 more across accessibility, readability & performance
          </p>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section
      id="use-cases"
      className="px-6 py-24"
      style={{ background: "var(--color-ps-surface)" }}
    >
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Use Cases</SectionLabel>
        <h2
          className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight"
          style={{ color: "var(--color-ps-ink)" }}
        >
          Built for every kind of product team.
        </h2>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="group relative flex flex-col gap-3 rounded-2xl p-6 transition-colors"
              style={{
                background: "var(--color-ps-canvas)",
                border: "1px solid var(--color-ps-border)",
              }}
            >
              <div
                className="w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  color: "rgba(165,180,252,0.9)",
                }}
              >
                {uc.tag}
              </div>
              <h3
                className="text-[14px] font-semibold"
                style={{ color: "var(--color-ps-ink)" }}
              >
                {uc.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-ps-ink-dim)" }}>
                {uc.description}
              </p>
              <Link
                href="/studio"
                className="mt-auto pt-2 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "rgba(165,180,252,0.9)" }}
              >
                Try this template →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 text-center">
      <h2
        className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight leading-snug"
        style={{ color: "var(--color-ps-ink)" }}
      >
        Start with your product.
        <br />
        <span style={{ color: "var(--color-ps-ink-dim)" }}>Ship with confidence.</span>
      </h2>
      <p
        className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed"
        style={{ color: "var(--color-ps-ink-dim)" }}
      >
        No login required. Works with Anthropic API or a local Ollama instance.
        Your data stays in your browser.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/studio"
          className="group inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--color-ps-accent)",
            color: "#fff",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 8px 24px rgba(99,102,241,0.3)",
          }}
        >
          Open Studio
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="flex items-center justify-between px-6 md:px-10 py-5 text-[12px]"
      style={{
        borderTop: "1px solid var(--color-ps-border)",
        color: "var(--color-ps-ink-ghost)",
      }}
    >
      <span>Product Studio</span>
      <div className="flex items-center gap-5">
        <Link href="/studio" className="hover:opacity-80 transition-opacity">Studio</Link>
        <a href="https://github.com" className="hover:opacity-80 transition-opacity">GitHub</a>
      </div>
    </footer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-widest"
      style={{ color: "rgba(165,180,252,0.7)" }}
    >
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: "var(--color-ps-canvas)", minHeight: "100vh" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ background: "var(--color-ps-accent)", color: "#fff" }}
      >
        Skip to main content
      </a>

      <Nav />

      <main id="main-content">
        <Hero />
        <Pipeline />
        <Features />
        <AuditEngine />
        <UseCases />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
