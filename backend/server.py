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
import jwt
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
    except jwt.PyJWTError:
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
    weak_spots: List[str] = []
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    api_key: Optional[str] = None

class ProfileAuditRequest(BaseModel):
    platform: str
    bio: str
    content_links: List[str] = []
    goals: List[str] = []
    weak_spots: List[str] = []
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    api_key: Optional[str] = None

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
    try:
        active_key = req.api_key or GEMINI_API_KEY
        if not active_key:
            return JSONResponse(
                status_code=400,
                content={"error": "no_api_key", "message": "Gemini API key required. Add yours in the app settings."}
            )

        # Fetch supplement catalog for personalization context
        sups: list = []
        try:
            sups_res = supabase_admin.from_("supplement_catalog").select("name, category, what_it_does, goal_tags").execute()
            sups = sups_res.data or []
        except Exception:
            pass

        user_profile_context = ""
        if req.weak_spots:
            user_profile_context += f"Weak spots: {', '.join(req.weak_spots)}. "
        if req.height_cm and req.weight_kg:
            user_profile_context += f"Stats: {req.height_cm}cm / {req.weight_kg}kg. "

        prompt = f"""You are an elite supplement consultant. Create a PERSONALIZED stack for a young man.

Goals: {', '.join(req.goals)}
{user_profile_context}
Available catalog (use these names): {json.dumps([s.get('name') for s in sups[:25] if s.get('name')])}

Return ONLY valid JSON — no markdown, no explanation outside JSON:
{{
  "stack_name": "Short punchy stack name",
  "stack_rationale": "2 sentences why this stack specifically",
  "supplements": [
    {{
      "name": "exact supplement name",
      "priority": "essential|recommended|optional",
      "reason": "specific reason for THIS user's goals",
      "timing_note": "exact when/how to take"
    }}
  ],
  "morning_protocol": "Morning: supplement1 + supplement2",
  "evening_protocol": "Evening: supplement3 + supplement4",
  "disclaimer": "General wellness info. Consult a doctor before starting."
}}"""

        import urllib.request as ureq
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={active_key}"
        req_obj = ureq.Request(api_url, data=payload, headers={"Content-Type": "application/json"})

        with ureq.urlopen(req_obj, timeout=20) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)

        # Persist to Supabase (non-blocking)
        try:
            if supabase_admin:
                supabase_admin.from_("supplement_stacks").insert({
                    "user_id": user_id,
                    "stack_data": result,
                    "goals": req.goals
                }).execute()
        except Exception:
            pass

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
    try:
        active_key = req.api_key or GEMINI_API_KEY
        if not active_key:
            return JSONResponse(
                status_code=400,
                content={"error": "no_api_key", "message": "Gemini API key required."}
            )

        profile_context = ""
        if req.goals:
            profile_context += f"Goals: {', '.join(req.goals)}. "
        if req.weak_spots:
            profile_context += f"Areas to improve: {', '.join(req.weak_spots)}. "
        if req.height_cm and req.weight_kg:
            profile_context += f"Stats: {req.height_cm}cm / {req.weight_kg}kg. "

        prompt = f"""You are an elite male self-improvement coach. Audit this {req.platform} profile/bio.

Bio: "{req.bio}"
{profile_context}

Return ONLY valid JSON — no markdown:
{{
  "score": 7.5,
  "vibe_rating": "One punchy phrase",
  "strengths": ["strength 1 specific to this bio", "strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "improvement 3"],
  "rewritten_bio": "Complete rewritten bio that is better",
  "quick_wins": ["actionable quick win 1", "quick win 2", "quick win 3"],
  "mystery_score": 7,
  "status_score": 6,
  "authenticity_score": 8,
  "weaknesses": ["weakness 1 specific to this bio", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}"""

        import urllib.request as ureq
        payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={active_key}"
        req_obj = ureq.Request(api_url, data=payload, headers={"Content-Type": "application/json"})

        with ureq.urlopen(req_obj, timeout=20) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        text = raw["candidates"][0]["content"]["parts"][0]["text"]
        text = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)

        try:
            if supabase_admin:
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
        return JSONResponse(status_code=500, content={"error": str(e)})

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

# ── Admin Guard ──────────────────────────────────────────────────────────────
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "cultleaderzoz.dev@gmail.com")

async def require_admin(user_id: str = Depends(get_current_user)) -> str:
    """Restrict endpoint to admin users only."""
    if not supabase_admin:
        raise HTTPException(status_code=503, detail="Database not configured")
    res = supabase_admin.from_("profiles").select("role").eq("id", user_id).maybe_single().execute()
    if not res.data or res.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id

# ── Admin Request Models ──────────────────────────────────────────────────────
class WisdomCardCreate(BaseModel):
    quote: str
    author: str
    lesson: Optional[str] = None
    action_today: Optional[str] = None
    card_date: Optional[str] = None

class UpdateUserPlan(BaseModel):
    plan: str

class UpdateUserRole(BaseModel):
    role: str

# ── Admin: Enhanced Stats ─────────────────────────────────────────────────────
@api_router.get("/admin/stats")
@limiter.limit("30/minute")
async def admin_stats(request: Request, admin_id: str = Depends(require_admin)):
    """Aggregate app statistics for admin dashboard."""
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        profiles = supabase_admin.from_("profiles").select("trial_end, subscription_status, banned").execute()
        rows = profiles.data or []
        def safe_dt(s):
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                return None
        total = len(rows)
        active_trial = sum(1 for r in rows if r.get("trial_end") and safe_dt(r["trial_end"]) and safe_dt(r["trial_end"]) > now)
        paying = sum(1 for r in rows if r.get("subscription_status") == "active")
        expired = sum(1 for r in rows if r.get("trial_end") and safe_dt(r["trial_end"]) and safe_dt(r["trial_end"]) <= now and r.get("subscription_status") != "active")
        posts_res = supabase_admin.from_("community_posts").select("id", count="exact").execute()
        workouts_res = supabase_admin.from_("workout_completions").select("id", count="exact").execute()
        cards_res = supabase_admin.from_("wisdom_cards").select("id", count="exact").execute()
        xp_res = supabase_admin.from_("xp_log").select("amount").execute()
        total_xp = sum(r.get("amount", 0) for r in (xp_res.data or []))
        return {
            "total_users": total, "active_trial": active_trial, "paying": paying, "expired": expired,
            "total_posts": posts_res.count or 0, "total_workouts": workouts_res.count or 0,
            "total_wisdom_cards": cards_res.count or 0, "total_xp_awarded": total_xp,
        }
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

# ── Admin: Users ──────────────────────────────────────────────────────────────
@api_router.get("/admin/users")
@limiter.limit("30/minute")
async def admin_list_users(
    request: Request,
    page: int = 1,
    limit: int = 20,
    admin_id: str = Depends(require_admin)
):
    offset = (page - 1) * limit
    try:
        res = supabase_admin.from_("profiles").select(
            "id, full_name, role, plan, xp, power_level, onboarding_completed, created_at"
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        count_res = supabase_admin.from_("profiles").select("id", count="exact").execute()
        return {"users": res.data or [], "total": count_res.count or 0, "page": page, "limit": limit}
    except Exception as e:
        logger.error(f"Admin users error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@api_router.put("/admin/users/{user_id}/plan")
@limiter.limit("30/minute")
async def admin_update_plan(
    request: Request,
    user_id: str,
    body: UpdateUserPlan,
    admin_id: str = Depends(require_admin)
):
    try:
        supabase_admin.from_("profiles").update({"plan": body.plan}).eq("id", user_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/users/{user_id}/role")
@limiter.limit("30/minute")
async def admin_update_role(
    request: Request,
    user_id: str,
    body: UpdateUserRole,
    admin_id: str = Depends(require_admin)
):
    try:
        supabase_admin.from_("profiles").update({"role": body.role}).eq("id", user_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/users/{user_id}")
@limiter.limit("30/minute")
async def admin_delete_user(
    request: Request,
    user_id: str,
    admin_id: str = Depends(require_admin)
):
    try:
        supabase_admin.auth.admin.delete_user(user_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Admin: Wisdom Cards ───────────────────────────────────────────────────────
@api_router.get("/admin/wisdom-cards")
@limiter.limit("30/minute")
async def admin_list_wisdom_cards(request: Request, admin_id: str = Depends(require_admin)):
    try:
        res = supabase_admin.from_("wisdom_cards").select("*").order("card_date", desc=True).limit(50).execute()
        return {"cards": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/wisdom-cards")
@limiter.limit("30/minute")
async def admin_create_wisdom_card(
    request: Request,
    card: WisdomCardCreate,
    admin_id: str = Depends(require_admin)
):
    try:
        insert_data = {
            "quote": card.quote,
            "author": card.author,
            "lesson": card.lesson,
            "action_today": card.action_today,
            "card_date": card.card_date or datetime.now().strftime("%Y-%m-%d"),
        }
        res = supabase_admin.from_("wisdom_cards").insert(insert_data).execute()
        return {"success": True, "card": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/wisdom-cards/{card_id}")
@limiter.limit("30/minute")
async def admin_delete_wisdom_card(
    request: Request,
    card_id: str,
    admin_id: str = Depends(require_admin)
):
    try:
        supabase_admin.from_("wisdom_cards").delete().eq("id", card_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Admin: Posts ─────────────────────────────────────────────────────────────
@api_router.get("/admin/posts")
@limiter.limit("30/minute")
async def admin_list_posts(request: Request, admin_id: str = Depends(require_admin)):
    try:
        res = supabase_admin.from_("community_posts").select("*").order("created_at", desc=True).limit(50).execute()
        return {"posts": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/posts/{post_id}")
@limiter.limit("30/minute")
async def admin_delete_post(
    request: Request,
    post_id: str,
    admin_id: str = Depends(require_admin)
):
    try:
        supabase_admin.from_("community_posts").delete().eq("id", post_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Admin: Health ─────────────────────────────────────────────────────────────
@api_router.get("/admin/health")
async def admin_health(request: Request, admin_id: str = Depends(require_admin)):
    return {"status": "ok", "admin": admin_id}


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

# ── Admin: Ban/Unban User ──────────────────────────────────────────────────────
@api_router.put("/admin/users/{user_id}/ban")
async def admin_toggle_ban(user_id: str, request: Request, admin_id: str = Depends(require_admin)):
    try:
        res = supabase_admin.from_("profiles").select("banned").eq("id", user_id).single().execute()
        current = res.data.get("banned", False)
        supabase_admin.from_("profiles").update({"banned": not current}).eq("id", user_id).execute()
        return {"success": True, "banned": not current}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Admin: Extend Trial ────────────────────────────────────────────────────────
@api_router.put("/admin/users/{user_id}/extend-trial")
async def admin_extend_trial(user_id: str, request: Request, admin_id: str = Depends(require_admin)):
    try:
        from datetime import datetime, timezone, timedelta
        new_end = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        supabase_admin.from_("profiles").update({"trial_end": new_end}).eq("id", user_id).execute()
        return {"success": True, "trial_end": new_end}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Library Videos (public) ───────────────────────────────────────────────────
@app.get("/api/library")
async def get_library():
    try:
        if supabase_admin:
            res = supabase_admin.from_("library_videos").select("*").order("created_at", desc=True).execute()
            return {"videos": res.data or []}
    except Exception:
        pass
    return {"videos": []}

# ── Library Videos CRUD (admin) ───────────────────────────────────────────────
@api_router.get("/admin/library-videos")
async def admin_list_library_videos(request: Request, admin_id: str = Depends(require_admin)):
    try:
        res = supabase_admin.from_("library_videos").select("*").order("created_at", desc=True).execute()
        return {"videos": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/library-videos")
async def admin_create_library_video(request: Request, admin_id: str = Depends(require_admin)):
    body = await request.json()
    try:
        res = supabase_admin.from_("library_videos").insert({
            "title": body.get("title"), "creator": body.get("creator"),
            "category": body.get("category"), "youtube_id": body.get("youtube_id"),
            "description": body.get("description", ""),
        }).execute()
        return {"success": True, "video": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/library-videos/{video_id}")
async def admin_update_library_video(video_id: str, request: Request, admin_id: str = Depends(require_admin)):
    body = await request.json()
    try:
        supabase_admin.from_("library_videos").update(body).eq("id", video_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/library-videos/{video_id}")
async def admin_delete_library_video(video_id: str, request: Request, admin_id: str = Depends(require_admin)):
    try:
        supabase_admin.from_("library_videos").delete().eq("id", video_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
