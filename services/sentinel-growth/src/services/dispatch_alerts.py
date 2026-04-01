"""
IC Origin — Scoring Alert Dispatcher
======================================
Task 4: dispatch_alerts()

Queries v_risk_scores for HIGH_RISK companies (score >= 7),
generates a 3-paragraph Strategic Memo via Gemini,
writes to Firestore (strategic_alerts collection),
and fires a Telegram message.

Mount this as a FastAPI router at /api/v1/scoring/dispatch
"""

import asyncio
import datetime
import structlog
import httpx
from typing import Optional

from google.cloud import bigquery, firestore
import google.generativeai as genai

from src.core.config import settings

logger = structlog.get_logger()

# ── Constants ──────────────────────────────────────────────────────────────────
BQ_PROJECT    = "cofound-agents-os-788e"
BQ_DATASET    = "ic_origin_themav2"
RISK_VIEW     = f"{BQ_PROJECT}.{BQ_DATASET}.v_risk_scores"
FS_COLLECTION = "strategic_alerts"

MACRO_CONTEXT = (
    "The current macroeconomic backdrop (April 2026): BoE Base Rate 3.75%, CPI 3.0%. "
    "Ongoing Strait of Hormuz supply chain disruption is elevating input costs and FX "
    "volatility for UK mid-market manufacturers and importers."
)


# ── Gemini Memo Generator ──────────────────────────────────────────────────────

async def generate_strategic_memo(company: dict) -> str:
    """
    Generate a 3-paragraph Strategic Memo via Gemini for a high-risk company.

    Paragraph 1: Hard legal signal summary (charges, insolvency, accounts)
    Paragraph 2: Soft signal & macro context (news sentiment, FX/rate exposure)
    Paragraph 3: Recommended action for Joshua / IC Origin client
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")

    prompt = f"""
You are a Senior Credit Intelligence Analyst at IC Origin, a Private Equity distress-signal platform.
Write a concise 3-paragraph Strategic Memo for Joshua (the fund manager) about the following company.

Company: {company['canonical_name']} (CRN: {company['entity_id']})
Risk Score: {company['risk_score']}/10 ({company['risk_label']})
Company Status: {company['company_status']}

Hard Signal Data:
- Outstanding charges: {company['outstanding_charges']}
- New charge filed within 90 days: {company['has_recent_charge']}
- Active insolvency proceedings: {company['has_insolvency']}
- Accounts overdue: {company.get('overdue_score', 0) > 0}
- Charge score: {company['charge_score']}/3

Soft Signal:
{company.get('soft_notes', 'No soft signal on record.')}

Graph Intelligence:
- Distressed external director links: {len(company.get('linked_distressed_companies') or [])}
{f"- Linked distressed entities: {', '.join(company['linked_distressed_companies'])}" if company.get('linked_distressed_companies') else "- No external distressed director links."}

Macro Context:
{MACRO_CONTEXT}

Format requirements:
- Paragraph 1 (HARD SIGNALS): Summarise the legal filing evidence. Be specific about charge dates and type.
- Paragraph 2 (CONTEXT): Blend soft signal findings and macro exposure. Be analytical.
- Paragraph 3 (RECOMMENDED ACTION): A clear directive for Joshua. Options: monitor, escalate to auction watch, initiate due diligence, or flag for immediate exit review.

Tone: Institutional. Concise. No hedging language. Maximum 250 words total.
"""

    response = await asyncio.to_thread(model.generate_content, prompt)
    return response.text


# ── Telegram Dispatcher ────────────────────────────────────────────────────────

async def send_telegram_alert(company: dict, memo_id: str) -> bool:
    """Send HIGH RISK alert to Telegram channel."""
    bot_token = settings.TELEGRAM_BOT_TOKEN
    chat_id   = settings.TELEGRAM_CHAT_ID

    if not bot_token or not chat_id:
        logger.warning("Telegram not configured — alert skipped",
                        company=company['canonical_name'])
        return False

    score       = company['risk_score']
    name        = company['canonical_name']
    crn         = company['entity_id']
    charge_note = f"{company['outstanding_charges']} outstanding charge(s)" \
                  if company['outstanding_charges'] else "no outstanding charges"
    soft_flag   = "Soft signal ELEVATED" if company.get('soft_score', 0) > 0 else ""
    macro_flag  = "Macro multiplier ACTIVE" if company.get('macro_score', 0) > 0 else ""
    graph_flag  = "Distressed director link detected" \
                  if company.get('graph_score', 0) > 0 else ""

    logic_parts = [p for p in [charge_note, soft_flag, macro_flag, graph_flag] if p]
    logic_str   = " · ".join(logic_parts)

    message = (
        f"🚨 *HIGH RISK: {name}* ({score}/10)\n"
        f"CRN: `{crn}` | Status: {company['company_status']}\n"
        f"Logic: {logic_str}\n"
        f"Memo available in SaaS Dashboard → `{FS_COLLECTION}/{memo_id}`"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id":    chat_id,
        "text":       message,
        "parse_mode": "Markdown",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
        logger.info("Telegram alert sent", company=name, score=score)
        return True
    except Exception as e:
        logger.error("Telegram alert failed", error=str(e), company=name)
        return False


# ── Firestore Memo Writer ──────────────────────────────────────────────────────

async def write_memo_to_firestore(company: dict, memo_text: str) -> str:
    """Persist memo to Firestore strategic_alerts collection. Returns doc ID."""
    db  = firestore.AsyncClient(project=BQ_PROJECT)
    now = datetime.datetime.now(datetime.timezone.utc)

    doc_data = {
        "entity_id":        company["entity_id"],
        "canonical_name":   company["canonical_name"],
        "risk_score":       company["risk_score"],
        "risk_label":       company["risk_label"],
        "company_status":   company["company_status"],
        "memo_text":        memo_text,
        "score_breakdown": {
            "charge":     company["charge_score"],
            "insolvency": company["insolvency_score"],
            "overdue":    company["overdue_score"],
            "soft":       company["soft_score"],
            "macro":      company["macro_score"],
            "graph":      company["graph_score"],
        },
        "generated_at":     now,
        "generated_by":     "ic-origin-dispatch-v1",
        "macro_context":    MACRO_CONTEXT,
    }

    doc_id = f"{company['entity_id']}_{now.strftime('%Y%m%d_%H%M%S')}"
    doc_ref = db.collection(FS_COLLECTION).document(doc_id)
    await doc_ref.set(doc_data)

    logger.info("Memo written to Firestore",
                company=company["canonical_name"], doc_id=doc_id)
    return doc_id


# ── Main Dispatcher ────────────────────────────────────────────────────────────

async def dispatch_alerts(
    dry_run: bool = False,
    score_threshold: int = 7,
) -> dict:
    """
    Core dispatcher function. Call from FastAPI endpoint or Cloud Scheduler.

    Args:
        dry_run:          If True, generate memos but skip Telegram + Firestore writes.
        score_threshold:  Alert threshold (default 7). Lower to 4 for SOME_CONCERN alerts.

    Returns:
        Summary dict with counts and dispatched company list.
    """
    log = logger.bind(threshold=score_threshold, dry_run=dry_run)
    log.info("dispatch_alerts() triggered")

    # ── Query v_risk_scores ────────────────────────────────────────────
    bq_client = bigquery.Client(project=BQ_PROJECT)
    query = f"""
        SELECT
            entity_id, canonical_name, company_status,
            risk_score, risk_label,
            charge_score, insolvency_score, overdue_score,
            soft_score, macro_score, graph_score, soft_notes,
            outstanding_charges, has_recent_charge, has_insolvency,
            linked_distressed_companies, flagged_directors
        FROM `{RISK_VIEW}`
        WHERE risk_score >= {score_threshold}
        ORDER BY risk_score DESC
    """
    hits = [dict(r) for r in bq_client.query(query).result()]

    log.info("High-risk companies found", count=len(hits))

    if not hits:
        return {
            "status":     "clean",
            "alerts_sent": 0,
            "companies":   [],
            "threshold":   score_threshold,
        }

    dispatched = []

    for company in hits:
        name  = company["canonical_name"]
        score = company["risk_score"]
        log.info("Processing high-risk company", company=name, score=score)

        try:
            # 1. Generate memo via Gemini
            memo_text = await generate_strategic_memo(company)
            log.info("Memo generated", company=name, words=len(memo_text.split()))

            memo_id = "dry_run"

            if not dry_run:
                # 2. Write to Firestore
                memo_id = await write_memo_to_firestore(company, memo_text)

                # 3. Fire Telegram alert
                await send_telegram_alert(company, memo_id)

            dispatched.append({
                "entity_id":     company["entity_id"],
                "canonical_name": name,
                "risk_score":    score,
                "memo_id":       memo_id,
                "memo_preview":  memo_text[:200] + "...",
            })

        except Exception as e:
            log.error("Failed to dispatch alert", company=name, error=str(e))
            continue

    return {
        "status":      "dispatched",
        "alerts_sent":  len(dispatched),
        "companies":    dispatched,
        "threshold":    score_threshold,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


# ── FastAPI Router ─────────────────────────────────────────────────────────────

from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/scoring", tags=["scoring"])


@router.post("/dispatch")
async def post_dispatch_alerts(
    dry_run:   bool = Query(False, description="Skip writes; preview memos only"),
    threshold: int  = Query(7,     description="Risk score threshold (1-10)"),
):
    """
    Trigger the scoring alert dispatcher.
    Queries v_risk_scores, generates Gemini memos, writes to Firestore,
    and fires Telegram alerts for all companies at or above threshold.
    """
    if not 1 <= threshold <= 10:
        raise HTTPException(status_code=422, detail="threshold must be between 1 and 10")

    result = await dispatch_alerts(dry_run=dry_run, score_threshold=threshold)
    return result


@router.get("/scores")
async def get_risk_scores(
    label: Optional[str] = Query(None, description="Filter by risk_label: HIGH_RISK, SOME_CONCERN, CLEAN"),
    limit: int           = Query(40,   description="Number of results"),
):
    """Return current risk scores from v_risk_scores view."""
    bq_client = bigquery.Client(project=BQ_PROJECT)

    where = f"WHERE risk_label = '{label}'" if label else ""
    rows = list(bq_client.query(
        f"SELECT entity_id, canonical_name, risk_score, risk_label, "
        f"charge_score, soft_score, macro_score, graph_score, company_status "
        f"FROM `{RISK_VIEW}` {where} ORDER BY risk_score DESC LIMIT {limit}"
    ).result())

    return {
        "count":   len(rows),
        "scores":  [dict(r) for r in rows],
        "view":    RISK_VIEW,
        "filter":  label,
    }
