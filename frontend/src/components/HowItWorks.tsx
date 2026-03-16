"use client";

import { motion } from "framer-motion";
import { Globe, Translate, Lightbulb } from "@phosphor-icons/react";

const STEPS = [
  {
    icon: Globe,
    title: "We Scrape",
    description:
      "Our crawlers monitor eight non-English developer communities around the clock, pulling every new post as it appears.",
  },
  {
    icon: Translate,
    title: "We Translate",
    description:
      "Each post is machine-translated into English so you never miss a signal because of a language barrier.",
  },
  {
    icon: Lightbulb,
    title: "We Surface",
    description:
      "An AI pipeline scores each post for novelty and groups them into trends, so only what matters reaches your feed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw">
      <motion.p
        className="hiw-label"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        HOW IT WORKS
      </motion.p>

      <motion.h2
        className="hiw-heading"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        Three steps. Zero noise.
      </motion.h2>

      <div className="hiw-grid">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              className="hiw-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.5,
                delay: 0.15 + i * 0.12,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <div className="hiw-icon-wrap">
                <Icon weight="duotone" size={32} />
              </div>
              <span className="hiw-step-num">0{i + 1}</span>
              <h3 className="hiw-card-title">{step.title}</h3>
              <p className="hiw-card-desc">{step.description}</p>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .hiw {
          width: 100%;
          padding: 100px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .hiw::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--border) 30%,
            var(--border) 70%,
            transparent 100%
          );
        }

        .hiw-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .hiw-heading {
          font-family: var(--font-cormorant), serif;
          font-size: 44px;
          font-weight: 300;
          color: var(--text-primary);
          margin-bottom: 64px;
        }

        .hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          max-width: 960px;
          width: 100%;
        }

        .hiw-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 28px 36px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface-elevated, var(--bg));
          transition: border-color 300ms ease, box-shadow 300ms ease;
        }

        .hiw-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 24px rgba(42, 122, 90, 0.08);
        }

        .hiw-icon-wrap {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(42, 122, 90, 0.1);
          color: var(--accent);
          margin-bottom: 20px;
        }

        .hiw-step-num {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .hiw-card-title {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .hiw-card-desc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 280px;
        }

        @media (max-width: 1024px) {
          .hiw {
            padding: 80px 32px;
          }

          .hiw-heading {
            font-size: 36px;
          }

          .hiw-grid {
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .hiw-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
          }

          .hiw-heading {
            font-size: 32px;
            margin-bottom: 48px;
          }
        }
      `}</style>
    </section>
  );
}
