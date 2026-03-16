# Global Arbitrage

Tech trends emerge in Japanese, Chinese, Russian, Korean, and Brazilian communities hours — sometimes days — before they surface in English. Global Arbitrage monitors 7 non-English tech communities in real time, translates every post, scores it for novelty, and surfaces what the English internet hasn't discovered yet.

<!-- INSERT PRODUCT SCREENSHOT OR DEMO GIF HERE -->
!(./assets/Lingo_Hax.gif)

---

## How it works

The pipeline runs every 30 minutes via APScheduler:

1. **scraper.py** — hits 7 non-English communities in parallel via HTTP and returns raw posts with title, body, source, language, score, and timestamp
2. **translate_engine.py** — batches all new posts through [Lingo.dev](https://lingo.dev) in a single call, preserving developer jargon
3. **brain.py** — sends translated posts to an LLM in one batched API call, returning category, novelty score (1–10), and an `english_coverage` boolean per post
4. **database.py** — stores every post in SQLite and deduplicates on ID so already-seen posts are never re-translated or re-classified
5. **main.py** — orchestrates the pipeline, computes velocity, and writes `categorized_global_trends.json` directly into the Next.js `public/` folder

The frontend is a [Next.js 14](https://nextjs.org) App Router application that reads the JSON file directly — no API layer — and polls every 60 seconds for updates.

---

## Sources monitored

| Community | Language | URL |
|-----------|----------|-----|
| [Qiita](https://qiita.com) | Japanese | qiita.com |
| [Zenn](https://zenn.dev) | Japanese | zenn.dev |
| [V2EX](https://v2ex.com) | Chinese | v2ex.com |
| [Habr](https://habr.com) | Russian | habr.com |
| [Velog](https://velog.io) | Korean | velog.io |
| [TabNews](https://tabnews.com.br) | Portuguese | tabnews.com.br |
| [r/programacion](https://reddit.com/r/programacion) | Spanish | reddit.com |

---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- A [Lingo.dev](https://lingo.dev) API key
- An LLM API key (see options below)

---

## LLM options

`brain.py` uses a single batched API call for classification. Any of the following providers work. Pick one and add the corresponding key to your `.env` file.

| Provider | Model recommended | Free tier | Notes |
|----------|------------------|-----------|-------|
| [Mistral](https://console.mistral.ai) | `mistral-small-latest` | No | Recommended. Fast, cheap, handles large batches well |
| [Groq](https://console.groq.com) | `llama3-8b-8192` | Yes | Rate limits apply on free tier |
| [Google Gemini](https://aistudio.google.com) | `gemini-1.5-flash` | Yes | Generous free tier |

You only need one. Set `LLM_PROVIDER` in your `.env` to match your choice — `mistral`, `groq`, `gemini`. The pipeline will route accordingly.

---

## Running locally

### 1. Clone the repository

```bash
git clone https://github.com/aprv10/lingo-hax.git
cd lingo-hax
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and fill in your API keys. At minimum you need `LINGO_API_KEY` and one LLM key.

### 3. Run the pipeline

```bash
python main.py
```

The first run will scrape all sources, translate, classify, and write `categorized_global_trends.json` into `frontend/public/`. Subsequent runs happen automatically every 30 minutes.

### 4. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
lingo-hax/
├── backend/
│   ├── main.py                  # Orchestration and scheduler
│   ├── scraper.py               # Parallel scraping across 7 sources
│   ├── translate_engine.py      # Lingo.dev batched translation
│   ├── brain.py                 # LLM classification and novelty scoring
│   ├── database.py              # SQLite persistence and deduplication
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Next.js App Router
│   ├── components/
│   └── public/
│       └── categorized_global_trends.json   # Written by backend
└── .env.example
```

---

## Environment variables

Copy `.env.example` to `.env` inside the `backend/` folder and fill in the values. See `.env.example` for all available options and descriptions.

---

## Tech stack

- **Backend** — Python, APScheduler, SQLite
- **Translation** — [Lingo.dev](https://lingo.dev)
- **Classification** — Mistral / Groq / Gemini (configurable)
- **Frontend** — Next.js 14, Tailwind CSS, Framer Motion
- **Map** — [Aceternity UI World Map](https://ui.aceternity.com/components/world-map)

---

## What to build next

If you fork this, the most obvious improvement is **trend memory** — tracking topic frequency across pipeline runs to compute real velocity rather than per-post novelty scores. A topic appearing across three consecutive runs with increasing post counts is a confirmed signal. A one-time spike is noise. The system currently cannot tell the difference.

Other directions worth exploring:

- Add more sources — German communities (Heise), Hindi developer forums
- Cross-reference `english_coverage` against live RSS feeds from Hacker News and Dev.to
- Weekly email digest of top hidden gems
- Persistent project idea storage so recommendations improve over time

---

## Contributing

Pull requests are welcome. For significant changes please open an issue first.

---

## License

MIT
