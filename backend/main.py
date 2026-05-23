import json
import os
import uvicorn 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pydantic import BaseModel

# ── App setup ────────────────────────────────────────────────────────────────
load_dotenv()
app = FastAPI(title="K-Trust API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Gemini client ─────────────────────────────────────────────────────────────
# Uses the NEW SDK — already installed on your machine
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── Load DB once at startup (not on every request) ───────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "market_intelligence.json"), "r", encoding="utf-8") as f:
    MARKET_DB = json.load(f)

# ── Pydantic schemas ──────────────────────────────────────────────────────────
# What the frontend SENDS to us
class AuditRequest(BaseModel):
    merchant_id: str

# What Gemini MUST return (enforced by response_schema)
class GeminiReport(BaseModel):
    trust_score: int
    risk_level: str
    risk_tags: list[str]
    legal_status: bool
    financial_risk: bool
    sentiment_score: bool
    executive_stability: bool
    summary: str

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "K-Trust API is running"}

@app.get("/merchants")
def list_merchants():
    return [
        {
            "merchant_id": m["merchant_id"],
            "company_name": m["company_name"],
            "platform": m["platform"],
        }
        for m in MARKET_DB["merchants"].values()
    ]

@app.post("/audit")
async def run_audit(request: AuditRequest):
    # 1. Look up merchant — 404 if not found
    merchant_id = request.merchant_id.strip().upper()
    merchant = MARKET_DB["merchants"].get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail=f"Merchant '{merchant_id}' not found.")

    # 2. Build prompt with ONLY this merchant's data
    raw = merchant["raw_data"]
    prompt = f"""
Audit this South Korean merchant and return a compliance report.

Company: {merchant["company_name"]}
Platform: {merchant["platform"]}
CEO: {merchant["ceo_name"]}
Founded: {merchant["founded"]}

LEGAL RECORDS:
{chr(10).join(raw["legal_records"])}

FINANCIAL SIGNALS:
{chr(10).join(raw["financial_signals"])}

EXECUTIVE CHANGES:
{chr(10).join(raw["executive_changes"])}

PLATFORM METRICS:
{chr(10).join(raw["platform_metrics"])}

PUBLIC SENTIMENT:
{chr(10).join(raw["naver_sentiment"])}
"""

    # 3. Call Gemini with enforced schema — no JSON parsing needed
    try:
        ai_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiReport,  # Gemini MUST match this shape
            ),
        )
        structured_data = json.loads(ai_response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    # 4. Return merged response
    return {
        "status": "success",
        "data": {
            "merchant_id": merchant["merchant_id"],
            "company_name": merchant["company_name"],
            "platform": merchant["platform"],
            **structured_data  # unpacks all Gemini fields into same object
        }
    }
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)