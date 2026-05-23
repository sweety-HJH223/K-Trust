import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# ── Config ──────────────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash-preview-04-17")

app = FastAPI(title="K-Trust API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   # your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load mock database once at startup ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "market_intelligence.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    MARKET_DB = json.load(f)

# ── Pydantic schemas ─────────────────────────────────────────────────────────
class AuditRequest(BaseModel):
    merchant_id: str

class AuditResponse(BaseModel):
    merchant_id: str
    company_name: str
    platform: str
    trust_score: int                  # 0 – 100
    risk_level: str                   # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    risk_tags: list[str]              # e.g. ["Pending Litigation", "CEO Change"]
    legal_status: bool                # True = clean, False = issues found
    financial_risk: bool              # True = low risk, False = risk detected
    sentiment_score: bool             # True = positive, False = negative
    executive_stability: bool         # True = stable, False = changes flagged
    summary: str                      # 2–3 sentence plain-English analysis

# ── Gemini prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are a senior Corporate Risk Compliance Expert specializing in East Asian markets.
You have been given raw intelligence data about a South Korean merchant.
Your job is to analyze this data and return ONLY a valid JSON object — no markdown,
no explanation, no preamble. Just the raw JSON.

The JSON must follow this exact schema:
{
  "trust_score": <integer 0-100>,
  "risk_level": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "risk_tags": [<list of short risk label strings, max 5>],
  "legal_status": <true if no serious legal issues, false if issues found>,
  "financial_risk": <true if financials look healthy, false if risk detected>,
  "sentiment_score": <true if public sentiment is mostly positive, false if negative>,
  "executive_stability": <true if leadership is stable, false if changes are flagged>,
  "summary": "<2-3 sentences of professional plain-English risk analysis>"
}

Scoring guide:
- 85–100: Verified, trusted partner. Recommend proceeding.
- 65–84: Generally reliable with minor flags. Proceed with standard due diligence.
- 40–64: Notable risks detected. Proceed with caution and additional verification.
- 0–39: Critical risk signals. Do not engage without thorough third-party audit.
"""

def build_user_prompt(merchant: dict) -> str:
    raw = merchant["raw_data"]
    return f"""
Merchant ID: {merchant["merchant_id"]}
Company: {merchant["company_name"]}
Platform: {merchant["platform"]}
CEO: {merchant["ceo_name"]}
Founded: {merchant["founded"]}
Category: {merchant["category"]}

--- LEGAL RECORDS ---
{chr(10).join(raw["legal_records"])}

--- FINANCIAL SIGNALS ---
{chr(10).join(raw["financial_signals"])}

--- EXECUTIVE CHANGES ---
{chr(10).join(raw["executive_changes"])}

--- PLATFORM METRICS ---
{chr(10).join(raw["platform_metrics"])}

--- NAVER PUBLIC SENTIMENT ---
{chr(10).join(raw["naver_sentiment"])}

Analyze the above and return the JSON compliance report.
"""

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "K-Trust API is running", "version": "1.0.0"}

@app.get("/merchants")
def list_merchants():
    """Returns all available merchant IDs and names for the search dropdown."""
    return [
        {
            "merchant_id": m["merchant_id"],
            "company_name": m["company_name"],
            "platform": m["platform"],
        }
        for m in MARKET_DB["merchants"].values()
    ]

@app.post("/audit", response_model=AuditResponse)
async def run_audit(request: AuditRequest):
    merchant_id = request.merchant_id.strip().upper()

    # 1. Look up merchant in local DB
    merchant = MARKET_DB["merchants"].get(merchant_id)
    if not merchant:
        raise HTTPException(
            status_code=404,
            detail=f"Merchant ID '{merchant_id}' not found in database. "
                   f"Available IDs: {list(MARKET_DB['merchants'].keys())}"
        )

    # 2. Build prompt and call Gemini
    prompt = build_user_prompt(merchant)
    try:
        response = model.generate_content(
            [SYSTEM_PROMPT, prompt],
            generation_config=genai.GenerationConfig(
                temperature=0.1,       # deterministic output
                max_output_tokens=512,
            ),
        )
        raw_text = response.text.strip()

        # Strip markdown fences if Gemini wraps in ```json ... ```
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        ai_data = json.loads(raw_text)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

    # 3. Merge merchant metadata with AI analysis
    return AuditResponse(
        merchant_id=merchant["merchant_id"],
        company_name=merchant["company_name"],
        platform=merchant["platform"],
        trust_score=ai_data["trust_score"],
        risk_level=ai_data["risk_level"],
        risk_tags=ai_data["risk_tags"],
        legal_status=ai_data["legal_status"],
        financial_risk=ai_data["financial_risk"],
        sentiment_score=ai_data["sentiment_score"],
        executive_stability=ai_data["executive_stability"],
        summary=ai_data["summary"],
    )