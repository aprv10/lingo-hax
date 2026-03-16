"use client";

import { useTheme } from "@/components/ThemeProvider";

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="editorial-footer">
      <div className="footer-content">
        {/* Centered quote */}
        <p className="footer-quote">
          "The best ideas don't wait for translation."
        </p>

        {/* Source communities list */}
        <p className="footer-sources">
          Qiita &middot; Zenn &middot; V2EX &middot; Habr &middot; Velog &middot; TabNews &middot; r/programacion
        </p>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Global Arbitrage
          </p>
          <p className="footer-credit">
            Powered by <a href="https://lingo.dev" target="_blank" rel="noopener noreferrer">lingo.dev</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .editorial-footer {
          background-color: var(--surface-flip);
          color: #ffffff;
          padding-top: 80px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .footer-content {
          max-width: 800px;
          padding: 0 24px;
          margin-bottom: 80px;
        }

        .footer-quote {
          font-family: var(--font-cormorant), serif;
          font-size: 32px;
          font-style: italic;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 24px;
          line-height: 1.3;
        }

        .footer-sources {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.4);
        }

        .footer-bottom {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px;
        }

        .footer-bottom-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        .footer-credit a {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: underline;
          text-decoration-color: rgba(255, 255, 255, 0.2);
          text-underline-offset: 4px;
          transition: color 200ms ease, text-decoration-color 200ms ease;
        }

        .footer-credit a:hover {
          color: rgba(255, 255, 255, 0.9);
          text-decoration-color: rgba(255, 255, 255, 0.9);
        }

        @media (max-width: 640px) {
          .editorial-footer {
            padding-top: 60px;
          }

          .footer-content {
            margin-bottom: 60px;
          }

          .footer-quote {
            font-size: 26px;
          }

          .footer-bottom-inner {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
