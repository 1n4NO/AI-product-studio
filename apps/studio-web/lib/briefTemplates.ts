import type { Brief } from "@product-studio/shared-types";

export interface BriefTemplate {
  id:          string;
  label:       string;
  icon:        string;
  description: string;
  brief:       Brief;
}

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id:          "saas",
    label:       "SaaS Product",
    icon:        "◧",
    description: "B2B or B2C software — trial-first funnel with value-prop clarity.",
    brief: {
      productName:      "ProductivityAI",
      audience:         "Knowledge workers at mid-size companies who manage 10+ projects",
      valueProposition: "Replace scattered tools with one AI workspace that thinks with you.",
      tone:             "bold",
      constraints:      [
        "Lead with the primary use case, not features",
        "Show social proof above the fold",
        "Single primary CTA — no competing actions",
      ],
      ctaGoal: "Start free trial",
    },
  },
  {
    id:          "ecommerce",
    label:       "E-Commerce",
    icon:        "◈",
    description: "Product-led storefront optimised for high-intent conversion.",
    brief: {
      productName:      "StyleShop",
      audience:         "Fashion-forward millennials aged 25–35 who shop on mobile",
      valueProposition: "Curated independent fashion, delivered next day.",
      tone:             "playful",
      constraints:      [
        "Visuals must dominate — minimal text above fold",
        "Urgency cues: limited stock, fast delivery",
        "Trust badges: returns, secure checkout",
      ],
      ctaGoal: "Shop the collection",
    },
  },
  {
    id:          "agency",
    label:       "Agency / Studio",
    icon:        "✦",
    description: "Portfolio-forward site that turns visitors into qualified leads.",
    brief: {
      productName:      "Pixel & Co.",
      audience:         "Startup founders and marketing leads seeking a design partner",
      valueProposition: "We design products that ship — brand, UX, and code under one roof.",
      tone:             "professional",
      constraints:      [
        "Lead with work, not about us",
        "Make expertise tangible with case study results",
        "Low-friction entry: book a call, not a proposal",
      ],
      ctaGoal: "Book a discovery call",
    },
  },
  {
    id:          "consumer-app",
    label:       "Consumer App",
    icon:        "◉",
    description: "App store or web install funnel — emotion first, features second.",
    brief: {
      productName:      "FitTrack",
      audience:         "Health-conscious Gen Z and millennials who want sustainable habits",
      valueProposition: "Your personal health coach, in your pocket — no gym required.",
      tone:             "friendly",
      constraints:      [
        "Lead with outcome transformation, not the product",
        "App screenshots must be hero-sized",
        "Social proof: community size or transformation stories",
      ],
      ctaGoal: "Download free",
    },
  },
  {
    id:          "devtool",
    label:       "Developer Tool",
    icon:        "⌘",
    description: "API or CLI product — technical credibility with zero friction.",
    brief: {
      productName:      "DeployBot",
      audience:         "Senior engineers at fast-moving startups running cloud infra",
      valueProposition: "Zero-config deployments from git push to production in 90 seconds.",
      tone:             "minimal",
      constraints:      [
        "Code snippet or terminal demo must be visible without scrolling",
        "No marketing jargon — speak engineer to engineer",
        "Show integration logos: GitHub, AWS, Vercel",
      ],
      ctaGoal: "Get API access",
    },
  },
  {
    id:          "marketplace",
    label:       "Marketplace",
    icon:        "⬡",
    description: "Two-sided platform — balance supply and demand messaging.",
    brief: {
      productName:      "LocalBite",
      audience:         "Urban professionals who value authentic local food experiences",
      valueProposition: "Discover and order from the best local restaurants — no chains.",
      tone:             "friendly",
      constraints:      [
        "Address both sides: diners and restaurants",
        "Curated feel — avoid listing-heavy homepage",
        "Location awareness: show nearby results immediately",
      ],
      ctaGoal: "Find restaurants near me",
    },
  },
];
