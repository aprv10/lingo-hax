"use client";

import { useState, useEffect } from "react";
import type { GlobalTrendsData } from "@/lib/types";
import { DATA_URL, POLL_INTERVAL } from "@/lib/constants";

interface UseGlobalTrendsReturn {
  data: GlobalTrendsData | null;
  isLoading: boolean;
  error: string | null;
}

export function useGlobalTrends(): UseGlobalTrendsReturn {
  const [data, setData] = useState<GlobalTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let lastGeneratedAt: string | null = null;

    async function fetchData() {
      try {
        const url = `${DATA_URL}?t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rawData = await res.json();
        let finalData: GlobalTrendsData;

        if (Array.isArray(rawData)) {
          // Fix the schema mismatch between array json and expected GlobalTrendsData
          const trendsMap = new Map<string, any>();
          
          rawData.forEach((item: any, idx: number) => {
            const cat = item.category || "Uncategorized";
            if (!trendsMap.has(cat)) {
              trendsMap.set(cat, {
                category: cat,
                post_count: 0,
                velocity: 15,
                momentum: "rising",
                key_technologies: [],
                sources: [],
                hidden_gem_count: 0,
                language_breakdown: {},
                posts: []
              });
            }
            
            const tr = trendsMap.get(cat);
            const lang = (item.original_lang || "en").toLowerCase();
            
            tr.post_count++;
            tr.language_breakdown[lang] = (tr.language_breakdown[lang] || 0) + 1;
            if (item.source && !tr.sources.includes(item.source)) tr.sources.push(item.source);
            
            tr.posts.push({
              id: `${idx}`,
              source: item.source,
              source_lang: lang,
              original_title: item.original_title,
              translated_title: item.english_title, // Map english_title to translated_title
              url: item.url,
              score: item.score || 0,
              scraped_at: new Date().toISOString(),
              key_technologies: item.key_technologies || [],
              novelty_score: item.novelty_score || 0,
              english_coverage: !!item.english_coverage
            });
            
            (item.key_technologies || []).forEach((t: string) => {
              if (!tr.key_technologies.includes(t)) tr.key_technologies.push(t);
            });
          });
          
          finalData = {
            generated_at: "mock-timestamp-from-array",
            total_posts: rawData.length,
            trends: Array.from(trendsMap.values())
          };
        } else {
          finalData = rawData;
        }

        if (!cancelled) {
          if (finalData.generated_at !== lastGeneratedAt) {
            lastGeneratedAt = finalData.generated_at;
            setData(finalData);
          }
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load briefing");
          setIsLoading(false);
        }
      }
    }

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, isLoading, error };
}
