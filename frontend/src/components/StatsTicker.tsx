"use client";

export function StatsTicker() {
  const stats = [
    "POSTS INDEXED: 2,847",
    "LANGUAGES MONITORED: 7",
    "HIDDEN GEMS: 142",
    'FASTEST RISING: AI & MACHINE LEARNING — 340%',
    "LAST BRIEFING: MAR 12 · 02:00 UTC",
  ];

  const separator = " · ";
  const tickerContent = stats.join(separator) + separator;

  return (
    <div className="stats-ticker">
      <div className="stats-ticker-track ticker-track">
        <span className="stats-ticker-content">{tickerContent}</span>
        <span className="stats-ticker-content">{tickerContent}</span>
      </div>

      <style jsx>{`
        .stats-ticker {
          width: 100%;
          height: 48px;
          background-color: var(--surface-flip);
          overflow: hidden;
          display: flex;
          align-items: center;
          position: relative;
        }

        .stats-ticker-track {
          display: flex;
          white-space: nowrap;
          animation: ticker-scroll 40s linear infinite;
        }

        .stats-ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .stats-ticker-content {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.05em;
          padding-right: 0px;
        }
      `}</style>
    </div>
  );
}
