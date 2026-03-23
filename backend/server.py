import google.generativeai as genai
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import create_client, Client
import os
from dotenv import load_dotenv
load_dotenv()
import logging
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
import base64
import io
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "maxx_app")
JWT_SECRET = os.getenv("JWT_SECRET")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", 8000))

if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")

# Supabase connection
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else None

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL) if MONGO_URL else None
db = client[DB_NAME] if client else None

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# Gemini Configuration
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

# Password hashing configuration (cost 12 per requirements)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

async def get_current_user_email(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    user["id"] = user.get("_id") or user.get("id")
    return user

# Define Models
class UserBase(BaseModel):
    email: str
    full_name: str
    date_of_birth: str = ""

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel) :
    email: str
    password: str

class OTPVerify(BaseModel):
    email: str
    code: str

class OnboardingData(BaseModel):
    goals: List[str]
    weak_spots: List[str]
    height_cm: int
    weight_kg: float
    sleep_hours: float
    activity_level: str

class FaceCoachRequest(BaseModel):
    ai_provider: str = "gemini"
    photo_base64: str
    baseline_photo_base64: Optional[str] = None

class RecalculatePowerRequest(BaseModel):
    user_id: str

class SupplementStackRequest(BaseModel):
    goals: List[str]
    current_plan: str

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

class SupportTicketRequest(BaseModel):
    name: str
    email: str
    category: str
    subject: str
    message: str

# In-memory OTP store
# Legacy in-memory OTP store (removed in favor of MongoDB pending_users)
# otp_store: dict[str, dict] = {}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@api_router.post("/auth/register")
@limiter.limit("5/15minute")
async def register(request: Request, req: UserCreate):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    existing = await db.users.find_one({"email": req.email})
    if existing:
        return {"success": False, "error": "Email already registered"}
    
    import random, datetime
    otp = str(random.randint(100000, 999999))
    expiry = datetime.datetime.now() + datetime.timedelta(minutes=10)
    
    user_data = req.dict()
    user_data["password"] = get_password_hash(req.password)
    user_data["otp"] = otp
    user_data["expires"] = expiry
    
    # Store in pending_users collection
    await db.pending_users.update_one(
        {"email": req.email}, 
        {"$set": user_data}, 
        upsert=True
    )
    
    logger.info(f"OTP generated for {req.email}: {otp}")
    return {"success": True, "requiresOtp": True}

@api_router.post("/auth/verify-otp")
@limiter.limit("5/15minute")
async def verify_otp(request: Request, req: OTPVerify):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    import datetime
    pending = await db.pending_users.find_one({"email": req.email})
    if not pending:
        return JSONResponse(status_code=400, content={"error": "Invalid or expired code, request a new one"})
        
    if datetime.datetime.now() > pending.get("expires"):
        await db.pending_users.delete_one({"email": req.email})
        return JSONResponse(status_code=400, content={"error": "Code expired, request a new one"})

    if pending.get("otp") != req.code:
        return JSONResponse(status_code=400, content={"error": "Invalid code"})
    
    user_data = pending.copy()
    user_id = str(uuid.uuid4())
    user_data["_id"] = user_id
    # Clean up fields not needed in final user doc
    user_data.pop("otp", None)
    user_data.pop("expires", None)
    
    await db.users.update_one({"email": req.email}, {"$set": user_data}, upsert=True)
    await db.pending_users.delete_one({"email": req.email})

    # Create Supabase profile
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        supabase.table("profiles").upsert({
            "id": user_id,
            "email": req.email,
            "full_name": user_data.get("full_name", ""),
            "xp": 0,
            "power_level": 0,
            "created_at": datetime.datetime.now().isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Failed to create Supabase profile: {e}")
    
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(data={"sub": user_data["email"]}, expires_delta=access_token_expires)
    
    response_user = user_data.copy()
    response_user.pop("password", None)
    
    return {
        "access_token": access_token,
        "refresh_token": f"refresh_mock_{user_id}",
        "user": response_user
    }

@api_router.post("/auth/login")
@limiter.limit("5/15minute")
async def login(request: Request, req: UserLogin):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password", "")):
        return {"success": False, "error": "Invalid credentials"}
    
    user["id"] = user["_id"]
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)
    
    response_user = user.copy()
    response_user.pop("password", None)

    return {
        "access_token": access_token,
        "refresh_token": f"refresh_mock_{user['id']}",
        "user": response_user
    }

@api_router.post("/user/onboarding")
@limiter.limit("60/minute")
async def sync_onboarding(request: Request, data: OnboardingData, current_user: dict = Depends(get_current_user)):
    try:
        # Validate data
        if not all([data.goals, data.weak_spots, data.height_cm, data.weight_kg, data.sleep_hours, data.activity_level]):
            return JSONResponse(status_code=400, content={"error": "All fields are required"})
        
        if not (100 <= data.height_cm <= 250):
            return JSONResponse(status_code=400, content={"error": "Height must be between 100 and 250 cm"})
        if not (30 <= data.weight_kg <= 300):
            return JSONResponse(status_code=400, content={"error": "Weight must be between 30 and 300 kg"})
        if not (2 <= data.sleep_hours <= 14):
            return JSONResponse(status_code=400, content={"error": "Sleep must be between 2 and 14 hours"})

        supabase.table("profiles").update({
            "goals": data.goals,
            "weak_spots": data.weak_spots,
            "height_cm": data.height_cm,
            "weight_kg": data.weight_kg,
            "sleep_hours": data.sleep_hours,
            "activity_level": data.activity_level,
            "onboarding_completed": True
        }).eq("id", current_user["id"]).execute()
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Onboarding error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to save onboarding."})

@api_router.post("/recalculate-power")
@limiter.limit("60/minute")
async def recalculate_power(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        # Assuming recalculate_power_level is an RPC in Supabase
        res = supabase.rpc('recalculate_power_level', {'user_id': current_user["id"]}).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@api_router.post("/supplement-stack")
@limiter.limit("3/day")
async def supplement_stack(request: Request, req: SupplementStackRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Mocking for brevity: In a real scenario, fetch supplements matching tags and pass to Gemini.
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Create a personalized supplement stack for goals: {req.goals}. Format as JSON list of dicts."
        res = model.generate_content(prompt)
        # INSERT supplement_stacks via Supabase
        # Return stack array
        return {"success": True, "stack": [], "disclaimer": "Medical disclaimer: Consult a doctor first."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@api_router.post("/moderate-post")
@limiter.limit("60/minute")
async def moderate_post(request: Request, req: ModeratePostRequest, current_user: dict = Depends(get_current_user)):
    model = genai.GenerativeModel('gemini-1.5-flash')
    res = model.generate_content(f"Does this text contain negativity or explicit content? Answer Yes or No. Text: {req.content}")
    approved = "no" in res.text.lower()
    return {"approved": approved, "reason": "Guidelines." if not approved else None}

@api_router.post("/profile-audit")
@limiter.limit("60/minute")
async def profile_audit(request: Request, req: ProfileAuditRequest, current_user: dict = Depends(get_current_user)):
    model = genai.GenerativeModel('gemini-1.5-flash')
    res = model.generate_content(f"Audit this social media bio for {req.platform}: {req.bio}. Return JSON with score, good_points, bad_points, suggestion_before, suggestion_after.")
    try:
        text = res.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        supabase.table("profile_audits").insert({
            "user_id": current_user["id"],
            "platform": req.platform,
            "bio_text": req.bio,
            "result": data
        }).execute()
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "AI Audit failed."})

@app.post("/api/ai/recalculate-power")
async def recalculate_power_ai(req: RecalculatePowerRequest):
    # Logic: Get workout count, nofap streak, etc. from Supabase
    # For now, return a mock calculation
    return {"power_level": 12, "rank": "Initiate", "next_rank_xp": 500}

@app.post("/api/ai/supplement-stack")
async def supplement_stack_ai(req: SupplementStackRequest):
    if not GEMINI_API_KEY: return {"stack": ["Creatine", "Magnesium", "Zinc"], "reason": "AI offline"}
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"Create a supplement stack for a man with goals: {req.goals}. Plan: {req.current_plan}. Be precise."
    res = model.generate_content(prompt)
    return {"stack": res.text}

@app.post("/api/ai/profile-audit")
async def profile_audit_ai(req: ProfileAuditRequest):
    if not GEMINI_API_KEY: return {"analysis": "Looks good.", "score": 75}
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"Audit this {req.platform} profile bio: {req.bio}. Give 3 tips and a score 0-100."
    res = model.generate_content(prompt)
    return {"analysis": res.text, "score": 82}

@app.post("/api/ai/moderate-post")
async def moderate_post_ai(req: ModeratePostRequest):
    # Quick filter
    banned = ["scam", "spam", "porn", "hate"]
    if any(w in req.content.lower() for w in banned):
        return {"flagged": True, "reason": "Keyword blocked"}
    
    if not GEMINI_API_KEY: return {"flagged": False}
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"Is this community post toxic, spam, or inappropriate? Content: '{req.content}'. Respond with ONLY VALID JSON like {{'flagged': bool, 'reason': string}}."
    res = model.generate_content(prompt)
    try:
        import json
        return json.loads(res.text)
    except:
        return {"flagged": False}

@app.post("/api/support")
async def support_ticket(req: SupportTicketRequest):
    if supabase:
        supabase.table("support_tickets").insert({
            "name": req.name,
            "email": req.email,
            "category": req.category,
            "subject": req.subject,
            "message": req.message
        }).execute()
    return {"success": True}

@app.get("/")
async def root():
    return {"status": "ok", "app": "MAXX API"}

@app.get("/status")
async def status_check():
    return {"status": "ok"}

@app.get("/api/status")
async def status():
    return {"status": "online", "db": "connected" if db else "offline"}

@app.post("/api/user/change-password")
@limiter.limit("3/15 minutes")
async def change_password(request: Request, data: ChangePasswordRequest, email: str = Depends(get_current_user_email)):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    user = await db.users.find_one({"email": email})
    if not user or not pwd_context.verify(data.old_password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid old password")
    
    hashed = pwd_context.hash(data.new_password)
    await db.users.update_one({"email": email}, {"$set": {"password": hashed}})
    return {"message": "Password changed successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
