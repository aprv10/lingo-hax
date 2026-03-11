// ═══════════════════════════════════════
// Global Arbitrage — Type Definitions
// Matches /public/categorized_global_trends.json shape
// ═══════════════════════════════════════

export type SourceLang = "ja" | "zh" | "ru" | "pt" | "ko" | "de" | "es";

export type Momentum = "rising" | "falling" | "new";

export interface Post {
  id: string;
  source: string;
  source_lang: SourceLang;
  original_title: string;
  translated_title: string;
  url: string;
  score: number;
  scraped_at: string; // ISO timestamp
  key_technologies: string[];
  novelty_score: number; // 1-10
  english_coverage: boolean;
}

export interface Trend {
  category: string;
  post_count: number;
  velocity: number; // percentage change, can be Infinity
  momentum: Momentum;
  key_technologies: string[];
  sources: string[];
  hidden_gem_count: number;
  language_breakdown: Record<string, number>;
  posts: Post[];
}

export interface GlobalTrendsData {
  generated_at: string; // ISO timestamp
  total_posts: number;
  trends: Trend[];
}

// ──────────────────────────────────────
// Language mapping
// ──────────────────────────────────────

export const LANGUAGE_MAP: Record<SourceLang, { flag: string; label: string }> = {
  ja: { flag: "🇯🇵", label: "Japanese" },
  zh: { flag: "🇨🇳", label: "Chinese" },
  ru: { flag: "🇷🇺", label: "Russian" },
  pt: { flag: "🇧🇷", label: "Portuguese" },
  ko: { flag: "🇰🇷", label: "Korean" },
  de: { flag: "🇩🇪", label: "German" },
  es: { flag: "🇪🇸", label: "Spanish" },
};

export function getLanguageLabel(lang: SourceLang): string {
  const entry = LANGUAGE_MAP[lang];
  return entry ? `${entry.flag} ${entry.label}` : lang;
}

export function getLanguageFlag(lang: SourceLang): string {
  return LANGUAGE_MAP[lang]?.flag ?? "";
}
