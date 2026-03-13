"use client";

import { Circle } from "@phosphor-icons/react";

// Placeholder live feed data — will be replaced with real data later
const LIVE_FEED_ITEMS = [
  { flag: "🇯🇵", source: "Qiita", title: "Your API Keys Are Completely Exposed to AI Agents — Here's How I Fixed It", novelty: 9 },
  { flag: "🇨🇳", source: "V2EX", title: "The Company Has Started Layoffs Because AI Is Too Effective", novelty: 7 },
  { flag: "🇯🇵", source: "Qiita", title: "The Unnatural Existence of AI Pretending It \"Can't Do What It Can\"", novelty: 8 },
  { flag: "🇨🇳", source: "V2EX", title: "Codex + various skills, automated requirement writing + debugging + deployment", novelty: 9 },
  { flag: "🇪🇸", source: "r/programacion", title: "When are we going to create a new derogatory term for AI-created apps?", novelty: 7 },
  { flag: "🇯🇵", source: "Qiita", title: "Making Claude Code Your \"Second Developer\" — Automated Pipeline", novelty: 9 },
  { flag: "🇨🇳", source: "V2EX", title: "My daughter was born, so I created a mini app to track her feeding", novelty: 6 },
  { flag: "🇯🇵", source: "Qiita", title: "Technical Research with GitHub Copilot Agent Mode × MCP × Microsoft Learn", novelty: 8 },
  { flag: "🇨🇳", source: "V2EX", title: "Has the price of the base model Mac mini M4 gone crazy?", novelty: 5 },
  { flag: "🇪🇸", source: "r/programacion", title: "We professional programmers lost the battle against AI", novelty: 4 },
];

export function LiveFeed() {
  // Duplicate items for seamless infinite scroll
  const doubled = [...LIVE_FEED_ITEMS, ...LIVE_FEED_ITEMS];

  return (
    <div className="live-feed-container">
      {/* Header */}
      <div className="live-feed-header">
        <Circle weight="fill" size={8} className="live-feed-dot" />
        <span className="live-feed-label">LIVE FEED</span>
      </div>

      {/* Scrolling feed */}
      <div className="live-feed-scroll-wrapper">
        <div className="live-feed-track">
          {doubled.map((item, i) => (
            <div key={i} className="live-feed-item">
              <div className="live-feed-item-top">
                <span className="live-feed-source">
                  {item.flag} {item.source}
                </span>
                <span className="live-feed-novelty">{item.novelty}</span>
              </div>
              <p className="live-feed-title">
                {item.title.length > 60
                  ? item.title.slice(0, 60) + "…"
                  : item.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .live-feed-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 32px 28px;
        }

        .live-feed-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .live-feed-dot {
          color: #2A7A5A;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .live-feed-label {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.6);
        }

        .live-feed-scroll-wrapper {
          flex: 1;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
        }

        .live-feed-item {
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .live-feed-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .live-feed-source {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 0.02em;
        }

        .live-feed-novelty {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        .live-feed-title {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.85);
        }
      `}</style>
    </div>
  );
}
