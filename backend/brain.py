import asyncio
import json
import re
from collections import Counter

# ---------------------------------------------------------------------------
# Category keyword dictionary — ~40-50 terms per category.
# Each keyword is a tuple: (keyword, tag) where tag is:
#   "mainstream" — widely discussed in English-language tech media
#   "emerging"   — niche, cutting-edge, or primarily known in non-English
#                  tech communities before gaining global traction
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS: dict[str, list[tuple[str, str]]] = {
    "AI & ML": [
        # --- mainstream ---
        ("machine learning", "mainstream"),
        ("deep learning", "mainstream"),
        ("neural network", "mainstream"),
        ("artificial intelligence", "mainstream"),
        ("natural language processing", "mainstream"),
        ("nlp", "mainstream"),
        ("computer vision", "mainstream"),
        ("cv", "mainstream"),
        ("pytorch", "mainstream"),
        ("tensorflow", "mainstream"),
        ("keras", "mainstream"),
        ("reinforcement learning", "mainstream"),
        ("scikit-learn", "mainstream"),
        ("xgboost", "mainstream"),
        ("gradient boosting", "mainstream"),
        ("bert", "mainstream"),
        ("yolo", "mainstream"),
        ("training", "mainstream"),
        ("inference", "mainstream"),
        ("recommendation system", "mainstream"),
        ("speech recognition", "mainstream"),
        ("object detection", "mainstream"),
        ("image generation", "mainstream"),
        ("text generation", "mainstream"),
        ("embedding", "mainstream"),
        ("attention mechanism", "mainstream"),
        ("neural architecture", "mainstream"),
        # --- emerging ---
        ("transformer", "emerging"),
        ("llm", "emerging"),
        ("large language model", "emerging"),
        ("gpt", "emerging"),
        ("chatgpt", "emerging"),
        ("openai", "emerging"),
        ("gemini", "emerging"),
        ("claude", "emerging"),
        ("mistral", "emerging"),
        ("llama", "emerging"),
        ("stable diffusion", "emerging"),
        ("midjourney", "emerging"),
        ("generative ai", "emerging"),
        ("gen ai", "emerging"),
        ("ai model", "emerging"),
        ("hugging face", "emerging"),
        ("huggingface", "emerging"),
        ("langchain", "emerging"),
        ("vector database", "emerging"),
        ("fine-tuning", "emerging"),
        ("fine tuning", "emerging"),
        ("rag", "emerging"),
        ("retrieval augmented", "emerging"),
        ("prompt engineering", "emerging"),
        ("diffusion model", "emerging"),
        ("automl", "emerging"),
        ("mlops", "emerging"),
        ("feature store", "emerging"),
        ("model serving", "emerging"),
        ("gpu cluster", "emerging"),
        ("onnx", "emerging"),
    ],
    "SaaS": [
        # --- mainstream ---
        ("saas", "mainstream"),
        ("software as a service", "mainstream"),
        ("subscription", "mainstream"),
        ("b2b", "mainstream"),
        ("b2c", "mainstream"),
        ("crm", "mainstream"),
        ("erp", "mainstream"),
        ("helpdesk", "mainstream"),
        ("customer support", "mainstream"),
        ("billing", "mainstream"),
        ("payment processing", "mainstream"),
        ("stripe", "mainstream"),
        ("salesforce", "mainstream"),
        ("hubspot", "mainstream"),
        ("zendesk", "mainstream"),
        ("slack", "mainstream"),
        ("notion", "mainstream"),
        ("project management", "mainstream"),
        ("collaboration tool", "mainstream"),
        ("productivity", "mainstream"),
        ("workspace", "mainstream"),
        ("integration", "mainstream"),
        ("analytics dashboard", "mainstream"),
        ("business intelligence", "mainstream"),
        ("data visualization", "mainstream"),
        ("reporting tool", "mainstream"),
        # --- emerging ---
        ("onboarding", "emerging"),
        ("churn", "emerging"),
        ("retention", "emerging"),
        ("monthly recurring revenue", "emerging"),
        ("mrr", "emerging"),
        ("arr", "emerging"),
        ("annual recurring revenue", "emerging"),
        ("pricing plan", "emerging"),
        ("freemium", "emerging"),
        ("trial", "emerging"),
        ("multi-tenant", "emerging"),
        ("tenant", "emerging"),
        ("white label", "emerging"),
        ("dashboard analytics", "emerging"),
        ("user management", "emerging"),
        ("paddle", "emerging"),
        ("lemon squeezy", "emerging"),
        ("product-led growth", "emerging"),
        ("plg", "emerging"),
        ("workflow automation", "emerging"),
        ("zapier", "emerging"),
        ("api platform", "emerging"),
        ("no-code", "emerging"),
        ("low-code", "emerging"),
        ("airtable", "emerging"),
        ("intercom", "emerging"),
        ("freshdesk", "emerging"),
        ("metabase", "emerging"),
    ],
    "Developer Tools": [
        # --- mainstream ---
        ("developer tool", "mainstream"),
        ("dev tool", "mainstream"),
        ("ide", "mainstream"),
        ("code editor", "mainstream"),
        ("vscode", "mainstream"),
        ("visual studio code", "mainstream"),
        ("vim", "mainstream"),
        ("jetbrains", "mainstream"),
        ("intellij", "mainstream"),
        ("debugger", "mainstream"),
        ("profiler", "mainstream"),
        ("linter", "mainstream"),
        ("git", "mainstream"),
        ("github", "mainstream"),
        ("gitlab", "mainstream"),
        ("version control", "mainstream"),
        ("ci/cd", "mainstream"),
        ("cicd", "mainstream"),
        ("continuous integration", "mainstream"),
        ("continuous deployment", "mainstream"),
        ("jenkins", "mainstream"),
        ("testing framework", "mainstream"),
        ("unit test", "mainstream"),
        ("npm", "mainstream"),
        ("pip", "mainstream"),
        ("sdk", "mainstream"),
        ("cli", "mainstream"),
        ("command line", "mainstream"),
        ("terminal", "mainstream"),
        ("shell", "mainstream"),
        ("documentation", "mainstream"),
        ("api docs", "mainstream"),
        ("swagger", "mainstream"),
        ("openapi", "mainstream"),
        ("pull request", "mainstream"),
        ("code review", "mainstream"),
        # --- emerging ---
        ("neovim", "emerging"),
        ("formatter", "emerging"),
        ("prettier", "emerging"),
        ("eslint", "emerging"),
        ("static analysis", "emerging"),
        ("bitbucket", "emerging"),
        ("github actions", "emerging"),
        ("end-to-end test", "emerging"),
        ("e2e", "emerging"),
        ("playwright", "emerging"),
        ("cypress", "emerging"),
        ("jest", "emerging"),
        ("pytest", "emerging"),
        ("test automation", "emerging"),
        ("package manager", "emerging"),
        ("yarn", "emerging"),
        ("pnpm", "emerging"),
        ("cargo", "emerging"),
        ("maven", "emerging"),
        ("gradle", "emerging"),
        ("dotfiles", "emerging"),
        ("devcontainer", "emerging"),
        ("codespace", "emerging"),
        ("copilot", "emerging"),
        ("code completion", "emerging"),
        ("ai assistant", "emerging"),
    ],
    "Web Development": [
        # --- mainstream ---
        ("web development", "mainstream"),
        ("frontend", "mainstream"),
        ("front-end", "mainstream"),
        ("backend", "mainstream"),
        ("back-end", "mainstream"),
        ("full stack", "mainstream"),
        ("fullstack", "mainstream"),
        ("react", "mainstream"),
        ("reactjs", "mainstream"),
        ("angular", "mainstream"),
        ("vue", "mainstream"),
        ("vuejs", "mainstream"),
        ("html", "mainstream"),
        ("css", "mainstream"),
        ("javascript", "mainstream"),
        ("typescript", "mainstream"),
        ("bootstrap", "mainstream"),
        ("sass", "mainstream"),
        ("scss", "mainstream"),
        ("webpack", "mainstream"),
        ("node.js", "mainstream"),
        ("nodejs", "mainstream"),
        ("express", "mainstream"),
        ("rest api", "mainstream"),
        ("graphql", "mainstream"),
        ("websocket", "mainstream"),
        ("responsive design", "mainstream"),
        ("dom", "mainstream"),
        ("single page application", "mainstream"),
        ("spa", "mainstream"),
        ("progressive web app", "mainstream"),
        ("pwa", "mainstream"),
        ("seo optimization", "mainstream"),
        # --- emerging ---
        ("next.js", "emerging"),
        ("nextjs", "emerging"),
        ("nuxt", "emerging"),
        ("nuxtjs", "emerging"),
        ("svelte", "emerging"),
        ("sveltekit", "emerging"),
        ("solid", "emerging"),
        ("solidjs", "emerging"),
        ("astro", "emerging"),
        ("remix", "emerging"),
        ("gatsby", "emerging"),
        ("tailwind", "emerging"),
        ("tailwindcss", "emerging"),
        ("vite", "emerging"),
        ("esbuild", "emerging"),
        ("rollup", "emerging"),
        ("turbopack", "emerging"),
        ("fastify", "emerging"),
        ("hono", "emerging"),
        ("deno", "emerging"),
        ("bun", "emerging"),
        ("trpc", "emerging"),
        ("ssr", "emerging"),
        ("server side rendering", "emerging"),
        ("static site", "emerging"),
        ("jamstack", "emerging"),
        ("web component", "emerging"),
        ("web performance", "emerging"),
        ("lighthouse", "emerging"),
        ("core web vitals", "emerging"),
        ("browser extension", "emerging"),
    ],
    "DevOps & Cloud": [
        # --- mainstream ---
        ("devops", "mainstream"),
        ("cloud", "mainstream"),
        ("aws", "mainstream"),
        ("amazon web services", "mainstream"),
        ("azure", "mainstream"),
        ("google cloud", "mainstream"),
        ("gcp", "mainstream"),
        ("infrastructure", "mainstream"),
        ("server", "mainstream"),
        ("linux", "mainstream"),
        ("docker", "mainstream"),
        ("container", "mainstream"),
        ("kubernetes", "mainstream"),
        ("k8s", "mainstream"),
        ("nginx", "mainstream"),
        ("load balancer", "mainstream"),
        ("cdn", "mainstream"),
        ("deployment", "mainstream"),
        ("monitoring", "mainstream"),
        ("logging", "mainstream"),
        ("networking", "mainstream"),
        ("sysadmin", "mainstream"),
        ("system administration", "mainstream"),
        ("vpc", "mainstream"),
        # --- emerging ---
        ("serverless", "emerging"),
        ("lambda", "emerging"),
        ("cloud function", "emerging"),
        ("containerization", "emerging"),
        ("microservice", "emerging"),
        ("orchestration", "emerging"),
        ("helm", "emerging"),
        ("terraform", "emerging"),
        ("pulumi", "emerging"),
        ("ansible", "emerging"),
        ("infrastructure as code", "emerging"),
        ("iac", "emerging"),
        ("observability", "emerging"),
        ("prometheus", "emerging"),
        ("grafana", "emerging"),
        ("datadog", "emerging"),
        ("new relic", "emerging"),
        ("elk", "emerging"),
        ("elasticsearch", "emerging"),
        ("cloudflare", "emerging"),
        ("reverse proxy", "emerging"),
        ("auto scaling", "emerging"),
        ("autoscaling", "emerging"),
        ("ci/cd pipeline", "emerging"),
        ("release management", "emerging"),
        ("canary release", "emerging"),
        ("blue-green deployment", "emerging"),
        ("service mesh", "emerging"),
        ("istio", "emerging"),
        ("envoy", "emerging"),
        ("vault", "emerging"),
        ("secrets management", "emerging"),
    ],
    "Cybersecurity": [
        # --- mainstream ---
        ("cybersecurity", "mainstream"),
        ("security", "mainstream"),
        ("vulnerability", "mainstream"),
        ("exploit", "mainstream"),
        ("firewall", "mainstream"),
        ("encryption", "mainstream"),
        ("cryptography", "mainstream"),
        ("tls", "mainstream"),
        ("ssl", "mainstream"),
        ("authentication", "mainstream"),
        ("authorization", "mainstream"),
        ("password", "mainstream"),
        ("malware", "mainstream"),
        ("phishing", "mainstream"),
        ("compliance", "mainstream"),
        ("gdpr", "mainstream"),
        ("data breach", "mainstream"),
        ("data leak", "mainstream"),
        ("ddos", "mainstream"),
        # --- emerging ---
        ("cve", "emerging"),
        ("penetration testing", "emerging"),
        ("pentest", "emerging"),
        ("ethical hacking", "emerging"),
        ("bug bounty", "emerging"),
        ("ransomware", "emerging"),
        ("social engineering", "emerging"),
        ("zero day", "emerging"),
        ("zero-day", "emerging"),
        ("intrusion detection", "emerging"),
        ("ids", "emerging"),
        ("ips", "emerging"),
        ("siem", "emerging"),
        ("soc", "emerging"),
        ("threat intelligence", "emerging"),
        ("incident response", "emerging"),
        ("forensics", "emerging"),
        ("certificate", "emerging"),
        ("oauth", "emerging"),
        ("jwt", "emerging"),
        ("mfa", "emerging"),
        ("two-factor", "emerging"),
        ("2fa", "emerging"),
        ("identity management", "emerging"),
        ("iam", "emerging"),
        ("access control", "emerging"),
        ("rbac", "emerging"),
        ("hipaa", "emerging"),
        ("soc2", "emerging"),
        ("iso 27001", "emerging"),
        ("owasp", "emerging"),
        ("xss", "emerging"),
        ("sql injection", "emerging"),
        ("csrf", "emerging"),
        ("reverse engineering", "emerging"),
        ("binary analysis", "emerging"),
    ],
    "Blockchain & Web3": [
        # --- mainstream ---
        ("blockchain", "mainstream"),
        ("cryptocurrency", "mainstream"),
        ("crypto", "mainstream"),
        ("bitcoin", "mainstream"),
        ("btc", "mainstream"),
        ("ethereum", "mainstream"),
        ("eth", "mainstream"),
        ("smart contract", "mainstream"),
        ("nft", "mainstream"),
        ("mining", "mainstream"),
        ("wallet", "mainstream"),
        ("token", "mainstream"),
        ("decentralized", "mainstream"),
        # --- emerging ---
        ("web3", "emerging"),
        ("solana", "emerging"),
        ("sol", "emerging"),
        ("polygon", "emerging"),
        ("matic", "emerging"),
        ("solidity", "emerging"),
        ("rust smart contract", "emerging"),
        ("defi", "emerging"),
        ("decentralized finance", "emerging"),
        ("dex", "emerging"),
        ("decentralized exchange", "emerging"),
        ("non-fungible token", "emerging"),
        ("tokenization", "emerging"),
        ("ico", "emerging"),
        ("dao", "emerging"),
        ("decentralized autonomous", "emerging"),
        ("metamask", "emerging"),
        ("ledger", "emerging"),
        ("staking", "emerging"),
        ("yield farming", "emerging"),
        ("liquidity pool", "emerging"),
        ("consensus", "emerging"),
        ("proof of stake", "emerging"),
        ("proof of work", "emerging"),
        ("layer 2", "emerging"),
        ("l2", "emerging"),
        ("rollup", "emerging"),
        ("zk", "emerging"),
        ("zero knowledge proof", "emerging"),
        ("ipfs", "emerging"),
        ("decentralized storage", "emerging"),
        ("web3.js", "emerging"),
        ("ethers.js", "emerging"),
        ("hardhat", "emerging"),
        ("foundry", "emerging"),
        ("truffle", "emerging"),
        ("cosmos", "emerging"),
        ("polkadot", "emerging"),
        ("avalanche", "emerging"),
        ("arbitrum", "emerging"),
        ("optimism", "emerging"),
        ("chainlink", "emerging"),
        ("oracle", "emerging"),
    ],
    "Mobile Development": [
        # --- mainstream ---
        ("mobile development", "mainstream"),
        ("mobile app", "mainstream"),
        ("ios", "mainstream"),
        ("android", "mainstream"),
        ("swift", "mainstream"),
        ("kotlin", "mainstream"),
        ("react native", "mainstream"),
        ("flutter", "mainstream"),
        ("native app", "mainstream"),
        ("app store", "mainstream"),
        ("play store", "mainstream"),
        ("google play", "mainstream"),
        ("push notification", "mainstream"),
        ("firebase", "mainstream"),
        ("cross-platform", "mainstream"),
        ("cross platform", "mainstream"),
        ("mobile ui", "mainstream"),
        ("mobile ux", "mainstream"),
        ("in-app purchase", "mainstream"),
        ("iap", "mainstream"),
        # --- emerging ---
        ("swiftui", "emerging"),
        ("uikit", "emerging"),
        ("jetpack compose", "emerging"),
        ("dart", "emerging"),
        ("expo", "emerging"),
        ("capacitor", "emerging"),
        ("ionic", "emerging"),
        ("xamarin", "emerging"),
        ("maui", "emerging"),
        (".net maui", "emerging"),
        ("hybrid app", "emerging"),
        ("apple developer", "emerging"),
        ("responsive mobile", "emerging"),
        ("adaptive layout", "emerging"),
        ("core data", "emerging"),
        ("room database", "emerging"),
        ("sqlite mobile", "emerging"),
        ("realm", "emerging"),
        ("crashlytics", "emerging"),
        ("testflight", "emerging"),
        ("fastlane", "emerging"),
        ("app performance", "emerging"),
        ("mobile testing", "emerging"),
        ("appium", "emerging"),
        ("detox", "emerging"),
        ("deep linking", "emerging"),
        ("universal link", "emerging"),
        ("arkit", "emerging"),
        ("arcore", "emerging"),
        ("wearable", "emerging"),
        ("watchos", "emerging"),
        ("wear os", "emerging"),
    ],
    "Open Source": [
        # --- mainstream ---
        ("open source", "mainstream"),
        ("open-source", "mainstream"),
        ("oss", "mainstream"),
        ("free software", "mainstream"),
        ("gnu", "mainstream"),
        ("gpl", "mainstream"),
        ("mit license", "mainstream"),
        ("apache license", "mainstream"),
        ("contribution", "mainstream"),
        ("contributor", "mainstream"),
        ("maintainer", "mainstream"),
        ("fork", "mainstream"),
        ("repository", "mainstream"),
        ("repo", "mainstream"),
        ("community", "mainstream"),
        ("linux foundation", "mainstream"),
        ("mozilla", "mainstream"),
        ("documentation", "mainstream"),
        ("wiki", "mainstream"),
        ("pull request", "mainstream"),
        # --- emerging ---
        ("foss", "emerging"),
        ("bsd license", "emerging"),
        ("creative commons", "emerging"),
        ("issue tracker", "emerging"),
        ("github trending", "emerging"),
        ("stars", "emerging"),
        ("hacktoberfest", "emerging"),
        ("gsoc", "emerging"),
        ("google summer of code", "emerging"),
        ("cncf", "emerging"),
        ("apache foundation", "emerging"),
        ("open core", "emerging"),
        ("source available", "emerging"),
        ("self-hosted", "emerging"),
        ("self hosted", "emerging"),
        ("selfhost", "emerging"),
        ("libre", "emerging"),
        ("copyleft", "emerging"),
        ("permissive license", "emerging"),
        ("release notes", "emerging"),
        ("changelog", "emerging"),
        ("roadmap", "emerging"),
        ("rfc", "emerging"),
        ("proposal", "emerging"),
        ("governance", "emerging"),
        ("code of conduct", "emerging"),
        ("sponsor", "emerging"),
        ("donation", "emerging"),
        ("sustainability", "emerging"),
        ("bus factor", "emerging"),
    ],
    "General Tech": [
        # --- mainstream ---
        ("technology", "mainstream"),
        ("tech", "mainstream"),
        ("startup", "mainstream"),
        ("programming", "mainstream"),
        ("coding", "mainstream"),
        ("software", "mainstream"),
        ("hardware", "mainstream"),
        ("computer science", "mainstream"),
        ("algorithm", "mainstream"),
        ("data structure", "mainstream"),
        ("database", "mainstream"),
        ("sql", "mainstream"),
        ("python", "mainstream"),
        ("java", "mainstream"),
        ("c++", "mainstream"),
        ("c#", "mainstream"),
        ("php", "mainstream"),
        ("ruby", "mainstream"),
        ("career", "mainstream"),
        ("interview", "mainstream"),
        ("hiring", "mainstream"),
        ("tutorial", "mainstream"),
        ("course", "mainstream"),
        ("conference", "mainstream"),
        ("robotics", "mainstream"),
        # --- emerging ---
        ("system design", "emerging"),
        ("architecture", "emerging"),
        ("nosql", "emerging"),
        ("postgresql", "emerging"),
        ("mysql", "emerging"),
        ("mongodb", "emerging"),
        ("redis", "emerging"),
        ("cassandra", "emerging"),
        ("remote work", "emerging"),
        ("freelance", "emerging"),
        ("side project", "emerging"),
        ("hackathon", "emerging"),
        ("meetup", "emerging"),
        ("bootcamp", "emerging"),
        ("rust", "emerging"),
        ("go", "emerging"),
        ("golang", "emerging"),
        ("elixir", "emerging"),
        ("haskell", "emerging"),
        ("scala", "emerging"),
        ("zig", "emerging"),
        ("wasm", "emerging"),
        ("webassembly", "emerging"),
        ("edge computing", "emerging"),
        ("iot", "emerging"),
        ("internet of things", "emerging"),
        ("quantum computing", "emerging"),
        ("ar", "emerging"),
        ("vr", "emerging"),
        ("mixed reality", "emerging"),
        ("autonomous", "emerging"),
        ("embedded", "emerging"),
        ("firmware", "emerging"),
        ("fpga", "emerging"),
        ("raspberry pi", "emerging"),
        ("arduino", "emerging"),
    ],
}


# ---------------------------------------------------------------------------
# Pre-compiled matching infrastructure
# ---------------------------------------------------------------------------

# Build lookup maps from the tagged dictionary
# keyword (lowercase) → (category, tag)
_KEYWORD_META: dict[str, tuple[str, str]] = {}
for _cat, _entries in CATEGORY_KEYWORDS.items():
    for _kw, _tag in _entries:
        _KEYWORD_META[_kw.lower()] = (_cat, _tag)

# Sorted longest-first so multi-word phrases match before single words
_SORTED_KEYWORDS = sorted(_KEYWORD_META.keys(), key=len, reverse=True)

# Pre-compile regex patterns: (compiled_pattern, keyword_text, category, tag)
_KEYWORD_PATTERNS: list[tuple[re.Pattern, str, str, str]] = []
for _kw in _SORTED_KEYWORDS:
    _cat, _tag = _KEYWORD_META[_kw]
    _pattern = re.compile(r"(?<!\w)" + re.escape(_kw) + r"(?!\w)", re.IGNORECASE)
    _KEYWORD_PATTERNS.append((_pattern, _kw, _cat, _tag))


# ---------------------------------------------------------------------------
# Confidence thresholds
# ---------------------------------------------------------------------------
CONFIDENCE_LOW = 1       # exactly 1 distinct keyword match
CONFIDENCE_MEDIUM = 2    # 2-3 distinct keyword matches
CONFIDENCE_HIGH = 4      # 4+ distinct keyword matches

# Minimum distinct-keyword count for a category to qualify as a secondary
SECONDARY_CATEGORY_MIN = 2

# ---------------------------------------------------------------------------
# Terms that hint low English coverage (non-English-ecosystem platforms)
# ---------------------------------------------------------------------------

_LOW_ENGLISH_COVERAGE_HINTS: set[str] = {
    "line app", "wechat", "mini program", "weixin", "alipay",
    "yandex", "vk", "telegram bot", "telegram channel",
    "kakao", "naver", "daum", "mercado libre", "mercadolibre",
    "nubank", "rappi", "bbc mundo", "nhk", "baidu", "tencent",
    "alibaba cloud", "aliyun", "douyin", "bilibili", "zhihu",
    "csdn", "qiita", "hatena", "habr", "habrahabr",
    "runet", "rustore", "sberbank", "gosuslugi",
}


# ---------------------------------------------------------------------------
# Classification helpers
# ---------------------------------------------------------------------------

def _get_confidence_level(distinct_count: int) -> str:
    """Return confidence tier based on the number of distinct keyword matches."""
    if distinct_count >= CONFIDENCE_HIGH:
        return "high"
    if distinct_count >= CONFIDENCE_MEDIUM:
        return "medium"
    if distinct_count >= CONFIDENCE_LOW:
        return "low"
    return "none"


def _compute_novelty(confidence: str, emerging_hits: int, mainstream_hits: int) -> int:
    """
    Compute novelty score (1-10) from the interaction of:
      - confidence level   (none / low / medium / high)
      - emerging keyword hits   (from tag)
      - mainstream keyword hits (from tag)

    Matrix:
                          | high conf | medium conf | low conf | none
    emerging dominant     |    10     |      9      |    7     |  6
    emerging present      |     9     |      8      |    6     |  6
    neutral               |     6     |      5      |    5     |  5
    mainstream present    |     4     |      4      |    3     |  5
    mainstream dominant   |     3     |      3      |    2     |  5
    """
    if confidence == "none":
        return 5

    emerging_dominant  = emerging_hits >= 3
    emerging_present   = emerging_hits >= 1
    mainstream_dominant = mainstream_hits >= 3
    mainstream_present  = mainstream_hits >= 1

    if emerging_dominant:
        return {"high": 10, "medium": 9, "low": 7}[confidence]
    if emerging_present and not mainstream_dominant:
        return {"high": 9, "medium": 8, "low": 6}[confidence]
    if not emerging_present and not mainstream_present:
        return {"high": 6, "medium": 5, "low": 5}[confidence]
    if mainstream_dominant:
        return {"high": 3, "medium": 3, "low": 2}[confidence]
    if mainstream_present:
        return {"high": 4, "medium": 4, "low": 3}[confidence]

    return 5  # fallback


# ---------------------------------------------------------------------------
# Core classification
# ---------------------------------------------------------------------------

def _classify_single(title: str, body: str) -> dict:
    """Classify a single post using confidence-based keyword matching.

    Returns dict with: category, secondary_category, key_technologies,
    novelty_score, english_coverage.
    """
    text = f"{title} {body[:1500]}".lower()

    # --- 1. Scan for keyword matches, track per-category distinct hits + tags ---
    # category → set of distinct keywords matched
    cat_keywords: dict[str, set[str]] = {}
    # Track tag counts across ALL matched keywords
    tag_counts: Counter = Counter()  # "mainstream" / "emerging"
    all_matched_keywords: list[str] = []  # ordered, for key_technologies

    for pattern, kw_text, cat, tag in _KEYWORD_PATTERNS:
        if pattern.search(text):
            cat_keywords.setdefault(cat, set()).add(kw_text)
            tag_counts[tag] += 1
            if kw_text not in all_matched_keywords:
                all_matched_keywords.append(kw_text)

    # --- 2. Primary + secondary category ---
    if not cat_keywords:
        # Zero matches across all categories → General Tech
        category = "General Tech"
        secondary_category = None
        confidence = "none"
    else:
        # Rank categories by distinct-keyword count (ties broken by dict size)
        ranked = sorted(
            cat_keywords.items(),
            key=lambda item: (len(item[1]), len(CATEGORY_KEYWORDS.get(item[0], []))),
            reverse=True,
        )

        category = ranked[0][0]
        winning_distinct = len(ranked[0][1])
        confidence = _get_confidence_level(winning_distinct)

        # Secondary: must be a different category with ≥ SECONDARY_CATEGORY_MIN
        # distinct matches AND at least medium confidence on its own
        secondary_category = None
        if len(ranked) >= 2:
            runner_up_cat = ranked[1][0]
            runner_up_count = len(ranked[1][1])
            runner_up_confidence = _get_confidence_level(runner_up_count)
            if (runner_up_count >= SECONDARY_CATEGORY_MIN
                    and runner_up_confidence in ("medium", "high")):
                secondary_category = runner_up_cat

    # --- 3. key_technologies: top 4 distinct matched keywords ---
    key_technologies = all_matched_keywords[:4]

    # --- 4. Novelty score via confidence × emerging/mainstream tag interaction ---
    emerging_hits = tag_counts.get("emerging", 0)
    mainstream_hits = tag_counts.get("mainstream", 0)
    novelty_score = _compute_novelty(confidence, emerging_hits, mainstream_hits)

    # --- 5. English coverage — driven by mainstream/emerging tag ratio ---
    english_coverage = True

    # Explicit non-English-ecosystem platform hints always override
    for hint in _LOW_ENGLISH_COVERAGE_HINTS:
        if hint in text:
            english_coverage = False
            break

    if english_coverage:
        if confidence == "none":
            # No recognised keywords → likely not in English tech media
            english_coverage = False
        elif mainstream_hits == 0 and emerging_hits >= 1:
            # Only emerging/niche keywords matched — not yet mainstream
            english_coverage = False
        elif emerging_hits > mainstream_hits * 2 and confidence == "low":
            # Heavily skewed toward emerging at low confidence
            english_coverage = False

    return {
        "category": category,
        "secondary_category": secondary_category,
        "key_technologies": key_technologies,
        "novelty_score": novelty_score,
        "english_coverage": english_coverage,
    }


# ---------------------------------------------------------------------------
# Public API — preserves the original contract
# ---------------------------------------------------------------------------

async def classify_posts(posts: list[dict]) -> list[dict]:
    """
    Classify posts using local keyword matching (offline, no API).
    Each post dict is enriched in-place with:
      category, secondary_category, key_technologies, novelty_score,
      english_coverage
    """
    if not posts:
        return posts

    batch_size = 50
    for i in range(0, len(posts), batch_size):
        batch = posts[i : i + batch_size]
        print(f"  Classifying batch {i // batch_size + 1} ({len(batch)} posts)...")

        for post in batch:
            title = post.get("translated_title", post.get("original_title", ""))
            body = post.get("translated_body", post.get("original_body", ""))

            result = _classify_single(title, body)

            post["category"] = result["category"]
            post["secondary_category"] = result["secondary_category"]
            post["key_technologies"] = result["key_technologies"]
            post["novelty_score"] = result["novelty_score"]
            post["english_coverage"] = result["english_coverage"]

        # Yield control so event loop stays responsive
        await asyncio.sleep(0)

    return posts


# ---------------------------------------------------------------------------
# Standalone execution (for testing / backward compat)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    async def _main():
        print("Loading translated global trends...")
        try:
            with open("translated_global_trends.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            print("Error: translated_global_trends.json not found! Run translation first.")
            return

        print(f"Classifying {len(data)} items using offline keyword matching...")
        classified = await classify_posts(data)

        with open("categorized_global_trends.json", "w", encoding="utf-8") as f:
            json.dump(classified, f, ensure_ascii=False, indent=2)
        print("\nSuccess! Intelligence Layer Complete.")

    asyncio.run(_main())