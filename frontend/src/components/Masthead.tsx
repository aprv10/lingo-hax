"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";
import WorldMap from "@/components/ui/world-map";

const SOURCE_COUNTRIES_DOTS = [
  { start: { lat: 40.7128, lng: -74.0060 }, end: { lat: 51.5074, lng: -0.1278 } }, // NY to London
  { start: { lat: 35.6762, lng: 139.6503 }, end: { lat: 34.0522, lng: -118.2437 } }, // Tokyo to LA
  { start: { lat: -23.5505, lng: -46.6333 }, end: { lat: 40.4168, lng: -3.7038 } }, // Sao Paulo to Madrid
  { start: { lat: -33.9249, lng: 18.4241 }, end: { lat: 19.0760, lng: 72.8777 } }, // Cape Town to Mumbai
  { start: { lat: -33.8688, lng: 151.2093 }, end: { lat: 1.3521, lng: 103.8198 } }, // Sydney to Singapore
  { start: { lat: 19.4326, lng: -99.1332 }, end: { lat: -34.6037, lng: -58.3816 } }, // MX City to Buenos Aires
  { start: { lat: 39.9042, lng: 116.4074 }, end: { lat: 52.5200, lng: 13.4050 } }, // Beijing to Berlin
  { start: { lat: 30.0444, lng: 31.2357 }, end: { lat: 25.7617, lng: -80.1918 } }, // Cairo to Miami
  { start: { lat: 41.9028, lng: 12.4964 }, end: { lat: -1.2921, lng: 36.8219 } }, // Rome to Nairobi
];


const HEADLINE_WORDS = ["Trends", "the", "internet", "hasn't", "discovered", "yet."];

const SUB_TEXT_LINE_1 = "The internet is bigger than English.";
const SUB_TEXT_LINE_2 = "By the time it hits English Twitter, ";
const SUB_TEXT_HIGHLIGHT = "you already knew.";

export function Masthead() {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="masthead">
      {/* Background Map layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <WorldMap
          dots={SOURCE_COUNTRIES_DOTS}
          lineColor={theme === "dark" ? "#a3a3a3" : "#404040"}
          className="w-full h-full absolute inset-0 bg-white dark:bg-black font-sans flex items-center justify-center [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
        />
        {/* Gradient overlay to ensure text is readable */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: theme === "dark" 
            ? "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)" 
            : "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none"
        }} />
      </div>

      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="masthead-theme-toggle"
      >
        <span
          className={`theme-icon ${theme === "dark" ? "theme-icon-rotate" : ""}`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </span>
      </button>

      {/* Left half */}
      <div className="masthead-left">
        <div className="masthead-left-inner">
          {/* Label */}
          <motion.p
            className="masthead-label"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            GLOBAL ARBITRAGE · INTELLIGENCE BRIEFING
          </motion.p>

          {/* Hero headline — word by word animation */}
          <h1 className="masthead-headline">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={i}
                className="masthead-word"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + i * 0.1,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {word}{" "}
              </motion.span>
            ))}
          </h1>

          {/* Wavy SVG underline */}
          <motion.div
            className="masthead-underline"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          >
            <svg
              viewBox="0 0 300 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              className="masthead-wavy-svg"
            >
              <path
                d="M0 4C25 0 50 8 75 4C100 0 125 8 150 4C175 0 200 8 225 4C250 0 275 8 300 4"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          {/* Subtext */}
          <motion.p
            className="masthead-subtext"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {SUB_TEXT_LINE_1}
            <br />
            {SUB_TEXT_LINE_2}
            <span className="masthead-highlight italic font-serif">
              {SUB_TEXT_HIGHLIGHT}
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="masthead-cta"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <button
              className="pill pill-filled masthead-btn"
              onClick={() =>
                document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Briefing
            </button>
            <button
              className="pill pill-ghost masthead-btn"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works
            </button>
          </motion.div>
        </div>
      </div>



      <style jsx>{`
        .masthead {
          width: 100%;
          min-height: 100vh;
          display: flex;
          position: relative;
        }

        .masthead-theme-toggle {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 100;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 200ms ease, color 200ms ease;
        }

        .masthead-theme-toggle:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .masthead-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 60px 80px 80px;
          position: relative;
          z-index: 10;
        }

        .masthead-left-inner {
          max-width: 640px;
        }

        .masthead-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 28px;
        }

        .masthead-headline {
          font-family: var(--font-cormorant), serif;
          font-size: 80px;
          font-weight: 300;
          line-height: 0.95;
          color: var(--text-primary);
          margin-bottom: 0;
        }

        .masthead-underline {
          width: 260px;
          margin-top: 12px;
          margin-bottom: 32px;
          transform-origin: left center;
        }

        .masthead-wavy-svg {
          width: 100%;
          height: 8px;
        }

        .masthead-subtext {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 18px;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: 36px;
        }

        .masthead-highlight {
          position: relative;
          display: inline-block;
          white-space: nowrap;
          z-index: 1;
        }
        
        .masthead-highlight::before {
          content: "";
          position: absolute;
          inset: auto -6px -2px -6px;
          height: 35%;
          background: linear-gradient(100deg, color-mix(in srgb, var(--accent) 60%, transparent) 0%, color-mix(in srgb, var(--accent) 60%, transparent) 100%);
          z-index: -1;
          transform: rotate(-1deg);
          border-radius: 4px;
        }

        .masthead-cta {
          display: flex;
          gap: 12px;
        }

        .masthead-btn {
          padding: 10px 24px;
          font-size: 13px;
          cursor: pointer;
          transition: opacity 200ms ease;
        }

        .masthead-btn:hover {
          opacity: 0.85;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .masthead {
            min-height: auto;
          }

          .masthead-left {
            padding: 120px 32px 60px;
          }

          .masthead-headline {
            font-size: 56px;
          }
        }

        @media (max-width: 640px) {
          .masthead-left {
            padding: 100px 24px 48px;
          }

          .masthead-headline {
            font-size: 42px;
          }

          .masthead-underline {
            width: 180px;
          }

          .masthead-subtext {
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  );
}
