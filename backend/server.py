import google.generativeai as genai
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
load_dotenv()
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ── Environment ──────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 8000))

# ── Supabase admin client (service role — never expose to frontend) ───────────
supabase_admin: Client = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    else None
)

# ── Gemini ────────────────────────────────────────────────────────────────────
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ── Auth dependency ───────────────────────────────────────────────────────────
# Security: Validates Supabase JWT — all protected routes use this dependency.
async def get_current_user(authorization: str = Header(None)) -> str:
    """Validates Supabase JWT and returns user_id (sub claim)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header"
        )
    token = authorization.replace("Bearer ", "", 1)
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Server JWT secret not configured")
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Request Models ────────────────────────────────────────────────────────────
class OnboardingData(BaseModel):
    goals: List[str]
    weak_spots: List[str]
    height_cm: int
    weight_kg: float
    sleep_hours: float
    activity_level: str

class SupplementStackRequest(BaseModel):
    goals: List[str]
    current_plan: str = "trial"

class ProfileAuditRequest(BaseModel):
    platform: str
    bio: str
    content_links: List[str] = []

class ModeratePostRequest(BaseModel):
    content: str

class ConversationRequest(BaseModel):
    scenario: str
    messages: List[Dict[str, str]]
    user_message: str
    api_key: Optional[str] = None

class SupportTicketRequest(BaseModel):
    name: str
    email: str
    category: str
    subject: str
    message: str

class RecalculatePowerRequest(BaseModel):
    user_id: str

# ── Onboarding ────────────────────────────────────────────────────────────────
@api_router.post("/user/onboarding")
@limiter.limit("60/minute")
async def sync_onboarding(
    request: Request,
    data: OnboardingData,
    user_id: str = Depends(get_current_user)
):
    # Security: only allow the authenticated user to update their own profile
    try:
        if not (100 <= data.height_cm <= 250):
            return JSONResponse(
                status_code=400,
                content={"error": "Height must be between 100 and 250 cm"}
            )
        if not (30 <= data.weight_kg <= 300):
            return JSONResponse(
                status_code=400,
                content={"error": "Weight must be between 30 and 300 kg"}
            )
        if not (2 <= data.sleep_hours <= 14):
            return JSONResponse(
                status_code=400,
                content={"error": "Sleep must be between 2 and 14 hours"}
            )

        supabase_admin.from_("profiles").update({
            "goals": data.goals,
            "weak_spots": data.weak_spots,
            "height_cm": data.height_cm,
            "weight_kg": data.weight_kg,
            "sleep_hours": data.sleep_hours,
            "activity_level": data.activity_level,
            "onboarding_completed": True
        }).eq("id", user_id).execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Onboarding error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to save onboarding data."}
        )

# ── Recalculate Power ─────────────────────────────────────────────────────────
@api_router.post("/recalculate-power")
@limiter.limit("60/minute")
async def recalculate_power(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    try:
        res = supabase_admin.rpc('recalculate_power_level', {'user_id': user_id}).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ── Supplement Stack (Gemini AI) ──────────────────────────────────────────────
@api_router.post("/supplement-stack")
@limiter.limit("10/hour")
async def supplement_stack(
    request: Request,
    req: SupplementStackRequest,
    user_id: str = Depends(get_current_user)
):
    # Security: Gemini API key stays server-side only
    try:
        # Fetch user profile for personalization
        profile_res = supabase_admin.from_("profiles") \
            .select("goals, weak_spots, plan") \
            .eq("id", user_id).single().execute()
        profile = profile_res.data or {}

        # Fetch relevant supplements from catalog
        sups_res = supabase_admin.from_("supplement_catalog") \
            .select("*").execute()
        sups = sups_res.data or []

        if not GEMINI_API_KEY:
            # Fallback stack when Gemini unavailable
            return {
                "success": True,
                "stack": [
                    {"supplement_key": "creatine", "priority": "essential",
                     "reason": "Foundational for strength and power", "timing_note": "Post-workout"},
                    {"supplement_key": "zinc", "priority": "essential",
                     "reason": "Testosterone support", "timing_note": "Before bed"},
                    {"supplement_key": "magnesium", "priority": "recommended",
                     "reason": "Sleep quality and recovery", "timing_note": "30min before sleep"},
                ],
                "disclaimer": "This is general wellness information, not medical advice."
            }

        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""You are a supplement expert. Based on these goals: {req.goals}
and these available supplements: {json.dumps(sups[:20])}

Create a personalized stack. Return ONLY valid JSON:
{{
  "stack_name": "Your Personalized Stack",
  "stack_rationale": "2 sentence explanation",
  "supplements": [
    {{
      "supplement_key": "zinc",
      "priority": "essential",
      "reason": "why this for their specific goals",
      "timing_note": "specific timing advice"
    }}
  ],
  "morning_protocol": "list of morning supplements",
  "evening_protocol": "list of evening supplements",
  "disclaimer": "This is general wellness information, not medical advice."
}}
Return only JSON, no markdown."""

        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)

        # Persist to Supabase
        try:
            supabase_admin.from_("supplement_stacks").insert({
                "user_id": user_id,
                "stack_data": result,
                "goals": req.goals
            }).execute()
        except Exception:
            pass  # Non-blocking

        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Supplement stack error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ── Profile Audit (Gemini AI) ─────────────────────────────────────────────────
@api_router.post("/profile-audit")
@limiter.limit("20/hour")
async def profile_audit(
    request: Request,
    req: ProfileAuditRequest,
    user_id: str = Depends(get_current_user)
):
    # Security: Gemini API key stays server-side only
    try:
        if not GEMINI_API_KEY:
            return {
                "score": 7.0,
                "vibe_rating": "Solid presence",
                "strengths": ["Clear identity", "Good structure"],
                "improvements": ["Add a personality hook", "Show more specificity", "Use action verbs"],
                "rewritten_bio": "Building strength daily. Training jaw, posture, and mindset. Ask me anything.",
                "quick_wins": ["Add one specific achievement", "Remove vague adjectives", "End with a question or hook"],
                "mystery_score": 6,
                "status_score": 7,
                "authenticity_score": 8
            }

        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""Analyze this {req.platform} profile bio for a young man.
Bio: "{req.bio}"

Return ONLY valid JSON:
{{
  "score": 7.5,
  "vibe_rating": "Solid but generic",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "rewritten_bio": "Your improved bio here",
  "quick_wins": ["quick win 1", "quick win 2", "quick win 3"],
  "mystery_score": 6,
  "status_score": 7,
  "authenticity_score": 8
}}
Return only JSON, no markdown."""

        res = model.generate_content(prompt)
        text = res.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)

        try:
            supabase_admin.from_("profile_audits").insert({
                "user_id": user_id,
                "platform": req.platform,
                "bio_text": req.bio,
                "result": data
            }).execute()
        except Exception:
            pass

        return data
    except Exception as e:
        logger.error(f"Profile audit error: {e}")
        return {
            "score": 5.0,
            "vibe_rating": "Average",
            "strengths": ["Has some personality"],
            "improvements": ["Too generic", "No conversation hook"],
            "rewritten_bio": "Training jaw + posture daily. Building something real.",
            "quick_wins": ["Add one specific detail", "Remove generic words"],
            "mystery_score": 5,
            "status_score": 5,
            "authenticity_score": 6
        }

# ── Conversation Lab (Gemini AI) ──────────────────────────────────────────────
@api_router.post("/conversation")
@limiter.limit("30/hour")
async def conversation(
    request: Request,
    req: ConversationRequest,
    user_id: str = Depends(get_current_user)
):
    """AI Convo Lab — handles scenario-based conversation practice."""
    # Security: Gemini API key stays server-side only
    try:
        active_key = req.api_key or GEMINI_API_KEY
        if not active_key:
            fallbacks = {
                "first_date": "That's interesting... tell me more.",
                "cold_approach": "Oh, um... you kind of surprised me there.",
                "salary_negotiation": "That's a bit higher than we anticipated.",
                "default": "Hmm, let me think about that."
            }
            return {"reply": fallbacks.get(req.scenario, fallbacks["default"])}

        system_prompt = {
            "first_date": "You are a young woman on a first date at a coffee shop. React realistically. After 8 exchanges give a score 1-10 and honest feedback.",
            "cold_approach": "You are a busy young woman on the street. A man just stopped you. React naturally — sometimes engaged, sometimes skeptical. After 6 exchanges give feedback.",
            "salary_negotiation": "You are a hiring manager. The candidate is negotiating salary. Be firm but fair. After 6 exchanges give feedback.",
            "conflict_frame": "You are a peer who disagrees strongly. Push back. After 6 exchanges give feedback on how well he held his frame.",
            "group_social": "You are part of a group. The user is joining. React naturally. After 8 exchanges give a score and feedback.",
            "texting_game": "You are a girl who met this guy once. He is texting you. You are slightly interested but testing. After 6 texts give whether he could have gotten a date.",
        }.get(req.scenario, "React naturally. After 6 exchanges give honest feedback.")

        conversation_history = "\n".join([
            f"{m['role'].upper()}: {m['content']}"
            for m in req.messages[-10:]
        ])
        prompt = (
            f"System: {system_prompt}\n\n"
            f"Conversation so far:\n{conversation_history}\n\n"
            f"User just said: {req.user_message}\n\n"
            f"Respond as the character (1-2 sentences max):"
        )

        import urllib.request
        import json
        req_data = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
        req_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={active_key}"
        urllib_req = urllib.request.Request(req_url, data=req_data, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(urllib_req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            
        text = res_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "Let me think about that...")
        return {"reply": text.strip()}
    except Exception as e:
        logger.error(f"Conversation error: {e}")
        return {"reply": "Let me think about that..."}

# ── Moderate Post ─────────────────────────────────────────────────────────────
@api_router.post("/moderate-post")
@limiter.limit("60/minute")
async def moderate_post(
    request: Request,
    req: ModeratePostRequest,
    user_id: str = Depends(get_current_user)
):
    # Quick keyword filter
    banned = ["scam", "spam", "porn", "hate"]
    if any(w in req.content.lower() for w in banned):
        return {"approved": False, "reason": "Keyword blocked"}

    if not GEMINI_API_KEY:
        return {"approved": True}

    model = genai.GenerativeModel('gemini-1.5-flash')
    res = model.generate_content(
        f"Does this text contain negativity or explicit content? "
        f"Answer Yes or No. Text: {req.content}"
    )
    approved = "no" in res.text.lower()
    return {"approved": approved, "reason": "Guidelines." if not approved else None}

# ── Support Tickets ───────────────────────────────────────────────────────────
@app.post("/api/support")
async def support_ticket(req: SupportTicketRequest):
    if supabase_admin:
        supabase_admin.from_("support_tickets").insert({
            "name": req.name,
            "email": req.email,
            "category": req.category,
            "subject": req.subject,
            "message": req.message
        }).execute()
    return {"success": True}

# ── Health Checks ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "app": "MAXX API"}

@app.get("/status")
async def status_check():
    return {"status": "ok"}

@app.get("/api/status")
async def api_status():
    return {"status": "online", "supabase": "connected" if supabase_admin else "offline"}

# ── App setup ─────────────────────────────────────────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
