"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";
import { LiveFeed } from "@/components/LiveFeed";

const HEADLINE_WORDS = ["Trends", "the", "internet", "hasn't", "discovered", "yet."];

const SUB_TEXT_LINE_1 = "We monitor 8 non-English tech communities in real time.";
const SUB_TEXT_LINE_2 = "By the time it hits English Twitter, you already knew.";

export function Masthead() {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="masthead">
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
                  delay: 0.3 + i * 0.08,
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
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="masthead-cta"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <button className="pill pill-filled masthead-btn">
              View Briefing
            </button>
            <button className="pill pill-ghost masthead-btn">
              How it works
            </button>
          </motion.div>
        </div>
      </div>

      {/* Right half — Live Feed */}
      <div className="masthead-right">
        <LiveFeed />
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

        /* Left half */
        .masthead-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 60px 80px 80px;
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
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: 36px;
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

        /* Right half — dark live feed panel */
        .masthead-right {
          width: 400px;
          flex-shrink: 0;
          background-color: var(--surface-flip);
          position: relative;
          overflow: hidden;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .masthead {
            flex-direction: column;
            min-height: auto;
          }

          .masthead-left {
            padding: 120px 32px 60px;
          }

          .masthead-headline {
            font-size: 56px;
          }

          .masthead-right {
            width: 100%;
            height: 400px;
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
