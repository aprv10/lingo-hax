"use client";

import { Globe, GithubLogo, Heart } from "@phosphor-icons/react";
import { LANGUAGE_MAP, type SourceLang } from "@/lib/types";

const LANGUAGES = Object.entries(LANGUAGE_MAP) as [SourceLang, { flag: string; label: string }][];

export function Footer() {
  return (
    <footer className="ga-footer">
      <div className="footer-inner">
        {/* Left: branding */}
        <div className="footer-brand">
          <p className="footer-title">GLOBAL ARBITRAGE</p>
          <p className="footer-sub">
            Surfacing non-English tech trends before they go global.
          </p>
        </div>

        {/* Center: language flags */}
        <div className="footer-languages">
          {LANGUAGES.map(([code, { flag, label }]) => (
            <span key={code} className="footer-lang" title={label}>
              {flag}
            </span>
          ))}
        </div>

        {/* Right: credits */}
        <div className="footer-credits">
          <p className="footer-powered">
            Powered by <a href="https://lingo.dev" target="_blank" rel="noopener noreferrer">lingo.dev</a>
          </p>
          <p className="footer-copy">
            <Globe weight="regular" size={12} />
            &nbsp;7 languages · 8 communities · real-time
          </p>
        </div>
      </div>

      <style jsx>{`
        .ga-footer {
          background-color: var(--surface-flip);
          color: rgba(255, 255, 255, 0.6);
          padding: 40px 48px;
          margin-top: 0;
        }

        .footer-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .footer-brand {
          flex-shrink: 0;
        }

        .footer-title {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 4px;
        }

        .footer-sub {
          font-family: var(--font-cormorant), serif;
          font-size: 16px;
          font-style: italic;
          color: rgba(255, 255, 255, 0.55);
        }

        .footer-languages {
          display: flex;
          gap: 12px;
          font-size: 20px;
        }

        .footer-lang {
          opacity: 0.7;
          transition: opacity 200ms ease, transform 200ms ease;
          cursor: default;
        }

        .footer-lang:hover {
          opacity: 1;
          transform: scale(1.15);
        }

        .footer-credits {
          flex-shrink: 0;
          text-align: right;
        }

        .footer-powered {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 4px;
        }

        .footer-powered a {
          color: rgba(255, 255, 255, 0.65);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .footer-powered a:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .footer-copy {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 2px;
        }

        @media (max-width: 768px) {
          .ga-footer {
            padding: 32px 24px;
          }

          .footer-inner {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .footer-credits {
            text-align: center;
          }

          .footer-copy {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
