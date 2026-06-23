import type { Brief, PageBlueprint } from "@product-studio/shared-types";

/** Escape HTML special characters to prevent XSS in the iframe srcdoc. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SECTION_ICONS: Record<string, string> = {
  hero:         "◆",
  problem:      "⚠",
  solution:     "◎",
  features:     "⊞",
  "social-proof": "✦",
  cta:          "→",
  pricing:      "$",
  faq:          "?",
  about:        "◉",
};

/**
 * Renders a complete, self-contained HTML page from a brief + blueprint.
 * The output is safe for use as an iframe srcdoc.
 */
export function renderPageHtml(
  brief:     Brief,
  blueprint: PageBlueprint,
  colorMode: "dark" | "light" = "dark",
): string {
  const dark = colorMode === "dark";

  const COLORS = {
    bg:          dark ? "#0c0c0f" : "#f4f4f8",
    surface:     dark ? "#0f0f14" : "#ffffff",
    raised:      dark ? "#14141e" : "#ededf5",
    border:      dark ? "#1e1e26" : "#d6d6e8",
    ink:         dark ? "#e2e2f0" : "#0a0a1a",
    inkDim:      dark ? "#8080b0" : "#40406a",
    inkGhost:    dark ? "#4a4a6a" : "#8888aa",
    accent:      "#7c3aed",
    accentSoft:  "#a78bfa",
    accentDim:   dark ? "#4f1da3" : "#6d28d9",
    ok:          "#30a060",
  };

  const sections = blueprint.sections
    .map((s) => {
      const icon = SECTION_ICONS[s.type] ?? "◇";
      const components = s.requiredComponents.slice(0, 4);
      return `
      <section class="bp-section">
        <div class="bp-section-header">
          <span class="bp-section-icon">${icon}</span>
          <div>
            <h3 class="bp-section-type">${esc(s.type.replace(/-/g, " "))}</h3>
            <p class="bp-section-intent">${esc(s.intent)}</p>
          </div>
        </div>
        <div class="bp-components">
          ${components.map((c) => `<span class="bp-chip">${esc(c)}</span>`).join("")}
          ${s.requiredComponents.length > 4 ? `<span class="bp-chip bp-chip-more">+${s.requiredComponents.length - 4} more</span>` : ""}
        </div>
      </section>`;
    })
    .join("\n");

  const navItems = ["Features", "Pricing", "About", "Blog"];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(brief.productName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:          ${COLORS.bg};
      --surface:     ${COLORS.surface};
      --raised:      ${COLORS.raised};
      --border:      ${COLORS.border};
      --ink:         ${COLORS.ink};
      --ink-dim:     ${COLORS.inkDim};
      --ink-ghost:   ${COLORS.inkGhost};
      --accent:      ${COLORS.accent};
      --accent-soft: ${COLORS.accentSoft};
      --accent-dim:  ${COLORS.accentDim};
      --ok:          ${COLORS.ok};
      --font: system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, "Cascadia Code", "Fira Code", monospace;
      --radius: 12px;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Navigation ── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      height: 56px;
      background: ${dark ? "rgba(12,12,15,0.85)" : "rgba(244,244,248,0.85)"};
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
    }
    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      color: var(--ink);
      text-decoration: none;
    }
    .nav-logo-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--accent), #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #fff;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
      list-style: none;
    }
    .nav-links a {
      color: var(--ink-dim);
      text-decoration: none;
      font-size: 13px;
      transition: color 0.15s;
    }
    .nav-links a:hover { color: var(--ink); }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .nav-cta:hover { opacity: 0.88; }

    /* ── Hero ── */
    .hero {
      padding: 80px 32px 72px;
      max-width: 760px;
      margin: 0 auto;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: var(--raised);
      font-size: 11px;
      font-weight: 600;
      color: var(--accent-soft);
      margin-bottom: 28px;
      letter-spacing: 0.05em;
    }
    .hero-title {
      font-size: clamp(28px, 5vw, 48px);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.025em;
      color: var(--ink);
      margin-bottom: 20px;
    }
    .hero-title em {
      font-style: normal;
      background: linear-gradient(135deg, var(--accent-soft), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 16px;
      color: var(--ink-dim);
      max-width: 560px;
      margin: 0 auto 36px;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 13px 28px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-dim), var(--accent));
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(124,58,237,0.3);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.4); }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      padding: 13px 24px;
      border-radius: 10px;
      border: 1px solid var(--border);
      color: var(--ink-dim);
      font-size: 14px;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }
    .btn-ghost:hover { background: var(--raised); color: var(--ink); }

    /* ── Social proof bar ── */
    .proof-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      font-size: 12px;
      color: var(--ink-ghost);
    }
    .proof-dot {
      width: 6px;
      height: 6px;
      border-radius: 99px;
      background: var(--ok);
    }

    /* ── Section container ── */
    .sections-container {
      max-width: 880px;
      margin: 0 auto 80px;
      padding: 0 32px;
    }
    .sections-label {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--ink-ghost);
      margin-bottom: 24px;
    }
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* ── Blueprint section card ── */
    .bp-section {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.15s;
    }
    .bp-section:hover { border-color: var(--accent); }
    .bp-section-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .bp-section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      background: linear-gradient(135deg, ${dark ? "#1a1230" : "#f0ecff"}, ${dark ? "#2d1a50" : "#e4daff"});
      color: var(--accent-soft);
    }
    .bp-section-type {
      font-size: 12px;
      font-weight: 700;
      text-transform: capitalize;
      color: var(--ink);
      margin-bottom: 3px;
    }
    .bp-section-intent {
      font-size: 11px;
      color: var(--ink-dim);
      line-height: 1.5;
    }
    .bp-components {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .bp-chip {
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--raised);
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--ink-ghost);
    }
    .bp-chip-more {
      color: var(--accent-soft);
      border-color: transparent;
      background: ${dark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.08)"};
    }

    /* ── Constraints ── */
    .constraints {
      max-width: 880px;
      margin: 0 auto 60px;
      padding: 0 32px;
    }
    .constraints-inner {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      padding: 20px 24px;
    }
    .constraints-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-ghost);
      margin-bottom: 14px;
    }
    .constraint-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .constraint-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: var(--ink-dim);
    }
    .constraint-tick {
      color: var(--ok);
      font-size: 11px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    /* ── Final CTA ── */
    .final-cta {
      margin: 0 auto 80px;
      max-width: 660px;
      padding: 48px 40px;
      text-align: center;
      border-radius: 20px;
      background: ${dark
        ? "linear-gradient(135deg, #1a1230, #0c0c1e)"
        : "linear-gradient(135deg, #f0ecff, #e6d9ff)"};
      border: 1px solid ${dark ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.2)"};
      margin-inline: 32px;
    }
    .final-cta h2 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin-bottom: 12px;
    }
    .final-cta p {
      font-size: 14px;
      color: var(--ink-dim);
      margin-bottom: 28px;
    }

    /* ── Tone tag ── */
    .tone-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 99px;
      background: ${dark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.1)"};
      font-size: 10px;
      font-weight: 600;
      color: var(--accent-soft);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav class="nav">
    <a href="#" class="nav-logo">
      <span class="nav-logo-icon">✦</span>
      ${esc(brief.productName)}
    </a>
    <ul class="nav-links">
      ${navItems.map((n) => `<li><a href="#">${n}</a></li>`).join("")}
    </ul>
    <a href="#" class="nav-cta">${esc(brief.ctaGoal)}</a>
  </nav>

  <!-- Hero -->
  <section class="hero">
    <div class="tone-tag">◈ ${esc(brief.tone)} tone</div>
    <h1 class="hero-title">
      <em>${esc(blueprint.title.replace(/ — Page Blueprint$/, "") || brief.productName)}</em>
    </h1>
    <p class="hero-sub">${esc(brief.valueProposition)}</p>
    <div class="hero-actions">
      <a href="#" class="btn-primary">${esc(brief.ctaGoal)} →</a>
      <a href="#" class="btn-ghost">See how it works</a>
    </div>
    <div class="proof-bar">
      <span class="proof-dot"></span>
      Built for ${esc(brief.audience)}
    </div>
  </section>

  <!-- Blueprint sections -->
  <div class="sections-container">
    <p class="sections-label">Page Blueprint · ${blueprint.sections.length} sections</p>
    <div class="sections-grid">
      ${sections}
    </div>
  </div>

  <!-- Constraints -->
  ${brief.constraints.length > 0 ? `
  <div class="constraints">
    <div class="constraints-inner">
      <p class="constraints-title">Design Constraints</p>
      <ul class="constraint-list">
        ${brief.constraints.map((c) => `
        <li class="constraint-item">
          <span class="constraint-tick">✓</span>
          <span>${esc(c)}</span>
        </li>`).join("")}
      </ul>
    </div>
  </div>` : ""}

  <!-- Final CTA -->
  <div style="padding: 0 32px;">
    <div class="final-cta">
      <h2>${esc(brief.productName)} is ready for you.</h2>
      <p>${esc(brief.valueProposition)}</p>
      <a href="#" class="btn-primary">${esc(brief.ctaGoal)} →</a>
    </div>
  </div>

</body>
</html>`;
}
