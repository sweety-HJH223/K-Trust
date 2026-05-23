# K-Trust — Korean Market Compliance Portal

> AI-powered B2B compliance verification system for South Korean merchants and platforms.

**Live Demo:** https://project-4xzgu-blush.vercel.app  
**GitHub:** https://github.com/sweety-HJH223/K-Trust

---

## What It Does

K-Trust is an enterprise compliance portal that audits South Korean merchants and platforms. Enter a merchant ID and the system instantly returns a structured risk assessment — trust score, legal status, financial health signals, public sentiment, and an AI-generated compliance summary.

It solves a real problem: international businesses trying to verify Korean partners face language barriers, fragmented data sources, and no unified risk scoring. K-Trust bridges that gap.

---

## Demo

| Merchant ID | Company | Expected Result |
|---|---|---|
| `CPNG-KR-00421` | SeoulTech Electronics | Score ~92, Low Risk |
| `NVRSMRT-KR-00887` | Hanguk Smart Living | Score ~10, Critical Risk |
| `KAKAO-KR-00156` | Busan Fresh Foods | Score ~95, Low Risk |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| AI Engine | Google Gemini 2.5 Flash |
| Data Validation | Pydantic |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

---

## Architecture

```
User → Next.js (Vercel)
         ↓ POST /audit
       FastAPI (Railway)
         ↓ reads
       market_intelligence.json (mock DB)
         ↓ prompt
       Gemini 2.5 Flash API
         ↓ structured JSON
       FastAPI → Next.js → UI renders
```

The AI pipeline uses `response_schema` enforcement — Gemini is constrained to return a typed Pydantic model, not free-form text. This guarantees the frontend always receives a predictable, parseable data structure.

---

## AI Engineering Highlights

**Structured Output Enforcement** — instead of prompting Gemini to "please return JSON," the system passes a Pydantic model as `response_schema`. Gemini is forced to match the exact field types and structure. No markdown stripping, no defensive parsing.

**Deterministic Compliance Scoring** — the system prompt includes a strict scoring rubric so Gemini produces consistent, auditable results rather than random assessments.

**Mock Data Layer** — merchant data is structured as a dictionary keyed by merchant ID for O(1) lookup. Raw data fields are intentionally unstructured strings (simulating scraped Korean court records, tax filings, sentiment data) — demonstrating that the LLM's role is extraction and classification, not just display.

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
# Add GEMINI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
# Add NEXT_PUBLIC_API_URL=http://localhost:8000 to .env.local
npm install
npm run dev
```

Open `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/merchants` | List all available merchant IDs |
| POST | `/audit` | Run AI compliance audit |

**POST /audit request:**
```json
{ "merchant_id": "CPNG-KR-00421" }
```

**POST /audit response:**
```json
{
  "status": "success",
  "data": {
    "trust_score": 92,
    "risk_level": "Low",
    "risk_tags": ["Minor Customer Service Lag"],
    "legal_status": true,
    "financial_risk": true,
    "sentiment_score": true,
    "executive_stability": true,
    "summary": "SeoulTech Electronics demonstrates strong compliance..."
  }
}
```

---

## Environment Variables

**Backend `.env`**
```
GEMINI_API_KEY=your_gemini_api_key
```

**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Roadmap

- Connect to Korea's DART financial API for real company data
- Integrate Naver Search API for live public sentiment
- Add historical audit logging with PostgreSQL
- Multi-language support (Korean UI)

---

Built by [@sweety-HJH223](https://github.com/sweety-HJH223)