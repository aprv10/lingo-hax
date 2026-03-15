"use client";

import { useMemo } from "react";
import { Masthead } from "@/components/Masthead";
import { HowItWorks } from "@/components/HowItWorks";
import { BuildThisWeek } from "@/components/BuildThisWeek";
import { Briefing } from "@/components/Briefing";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { useGlobalTrends } from "@/hooks/useGlobalTrends";

export default function Home() {
  const { data, isLoading, error } = useGlobalTrends();

  /* Top 20 posts by novelty score, one per line: title | category | novelty | source */
  const trendsContext = useMemo(() => {
    if (!data) return "";
    return data.trends
      .flatMap((t) => t.posts.map((p) => ({ ...p, category: t.category })))
      .sort((a, b) => (b.novelty_score ?? 0) - (a.novelty_score ?? 0))
      .slice(0, 20)
      .map((p) => `${p.translated_title || p.original_title} | ${p.category} | ${p.novelty_score ?? 0} | ${p.source}`)
      .join("\n");
  }, [data]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: 48,
          fontStyle: "italic",
          color: "var(--text-muted)",
          animation: "pulse-loading 2s ease-in-out infinite",
        }}>
          LOADING BRIEFING...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: 48,
          fontStyle: "italic",
          color: "var(--text-muted)",
        }}>
          BRIEFING UNAVAILABLE
        </p>
      </div>
    );
  }

  return (
    <>
      <Masthead />
      <HowItWorks />
      <BuildThisWeek ideas={data.project_ideas ?? []} />
      <Briefing data={data} />
      <Footer />
      <ChatWidget trendsContext={trendsContext} />
    </>
  );
}