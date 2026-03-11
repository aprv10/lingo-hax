"use client";

import { Masthead } from "@/components/Masthead";
import { StatsTicker } from "@/components/StatsTicker";
import { Briefing } from "@/components/Briefing";
import { Footer } from "@/components/Footer";
import { useGlobalTrends } from "@/hooks/useGlobalTrends";

export default function Home() {
  const { data, isLoading, error } = useGlobalTrends();

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
      <StatsTicker />
      <Briefing data={data} />
      <Footer />
    </>
  );
}