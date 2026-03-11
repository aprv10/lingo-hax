// ═══════════════════════════════════════
// Global Arbitrage — Constants
// ═══════════════════════════════════════

/** Polling interval for data refresh (ms) */
export const POLL_INTERVAL = 60_000;

/** Data source URL */
export const DATA_URL = "/categorized_global_trends.json";

/** Language bar segment colors for the breakdown visualization */
export const LANGUAGE_COLORS: Record<string, string> = {
  ja: "#C8502A",  // warm terracotta
  zh: "#D4A84B",  // gold
  ru: "#5B8A72",  // sage green
  pt: "#3A7CA5",  // steel blue
  ko: "#8B6AA0",  // muted purple
  de: "#7A6E62",  // warm grey
  es: "#B85C38",  // burnt sienna
};

/** All supported source languages */
export const ALL_LANGUAGES = ["ja", "zh", "ru", "pt", "ko", "de", "es"] as const;
