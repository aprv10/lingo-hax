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

        const json: GlobalTrendsData = await res.json();

        if (!cancelled) {
          if (json.generated_at !== lastGeneratedAt) {
            lastGeneratedAt = json.generated_at;
            setData(json);
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
