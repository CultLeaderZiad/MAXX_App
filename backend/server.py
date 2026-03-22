from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'maxx_app')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'secret_key_change_me')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing configuration
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
        
    # Convert _id to id for consistency
    user["id"] = user["_id"]
    return user

# Define Models
class UserBase(BaseModel):
    email: str
    full_name: str
    date_of_birth: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel) :
    email: str
    password: str

class UserResponse(UserBase):
    id: str = Field(alias="_id")

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict

class OTPVerify(BaseModel):
    email: str
    code: str

# New Models for Priority 2
class StreakUpdate(BaseModel):
    streak_type: str
    current_streak: int
    last_activity_date: str

class WorkoutLog(BaseModel):
    workout_id: str
    workout_type: str
    xp_earned: int

class XPUpdate(BaseModel):
    amount: int
    reason: str

# In-memory OTP store (for dev only)
otp_store: dict[str, dict] = {}

@api_router.post("/auth/register")
async def register(req: UserCreate):
    # Simulated check for existing user
    existing = await db.users.find_one({"email": req.email})
    if existing:
        return {"success": False, "error": "Email already registered"}
    
    # Store temporary user or pending verification
    otp = "123456" # Hardcoded for now per requirements
    
    # Hash password before storing
    user_data = req.dict()
    user_data["password"] = get_password_hash(req.password)
    
    otp_store[req.email] = {"data": user_data, "otp": otp}
    return {"success": True, "requiresOtp": True}

@api_router.post("/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    pending = otp_store.get(req.email)
    if not pending or pending.get("otp") != req.code:
        return {"success": False, "error": "Invalid or expired code"}
    
    user_data = pending.get("data", {}).copy()
    user_id = str(uuid.uuid4())
    user_data["_id"] = user_id
    
    # Initialize default fields (Priority 2)
    user_data.update({
        "power_level": 1,
        "xp": 0,
        "level_title": "Beginner",
        "goals": [],
        "weak_spots": [],
        "streaks": [],
        "workout_completions": []
    })
    
    await db.users.update_one({"email": req.email}, {"$set": user_data}, upsert=True)
    
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data["email"]}, expires_delta=access_token_expires
    )
    
    # Remove password from response only
    response_user = user_data.copy()
    if "password" in response_user:
        del response_user["password"]
    
    return {
        "access_token": access_token,
        "refresh_token": f"refresh_mock_{user_id}", # Keep mock refresh for now as not specified in requirements
        "user": response_user
    }

@api_router.post("/auth/login")
async def login(req: UserLogin):
    user = await db.users.find_one({"email": req.email})
    if not user:
        return {"success": False, "error": "Invalid credentials"}
    
    # Check password with bcrypt
    if not verify_password(req.password, user.get("password", "")):
         return {"success": False, "error": "Invalid credentials"}

    user["id"] = user["_id"]
    
    # Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # Remove password from response
    response_user = user.copy()
    if "password" in response_user:
        del response_user["password"]

    return {
        "access_token": access_token,
        "refresh_token": f"refresh_mock_{user['id']}",
        "user": response_user
    }

# --- Priority 2 Endpoints ---

@api_router.post("/user/streak")
async def update_streak(streak: StreakUpdate, current_user: dict = Depends(get_current_user)):
    # Update or add streak in user's streaks list
    # streak_type is unique key
    
    result = await db.users.update_one(
        {"email": current_user["email"], "streaks.type": streak.streak_type},
        {"$set": {
            "streaks.$.current": streak.current_streak,
            "streaks.$.last_date": streak.last_activity_date
        }}
    )
    
    if result.matched_count == 0:
        # Streak type doesn't exist, push new one
        await db.users.update_one(
            {"email": current_user["email"]},
            {"$push": {"streaks": {
                "type": streak.streak_type,
                "current": streak.current_streak,
                "longest": streak.current_streak,
                "last_date": streak.last_activity_date
            }}}
        )
    else:
        # Check if we need to update longest streak
        # We need to fetch the specific streak to compare (optimized to just update if greater could be done with aggregation but logic is simpler here)
        user = await db.users.find_one({"email": current_user["email"]})
        for s in user.get("streaks", []):
            if s["type"] == streak.streak_type:
                if streak.current_streak > s.get("longest", 0):
                    await db.users.update_one(
                        {"email": current_user["email"], "streaks.type": streak.streak_type},
                        {"$set": {"streaks.$.longest": streak.current_streak}}
                    )
                break
                
    return {"success": True}

@api_router.post("/user/workout")
async def log_workout(workout: WorkoutLog, current_user: dict = Depends(get_current_user)):
    workout_entry = workout.dict()
    workout_entry["date"] = datetime.utcnow().isoformat()
    
    await db.users.update_one(
        {"email": current_user["email"]},
        {
            "$push": {"workout_completions": workout_entry},
            "$inc": {"xp": workout.xp_earned}
        }
    )
    
    # Recalculate power level
    # Formula: Level = 1 + (XP / 1000) (Simple example)
    # We will trigger the power level update in a separate call or here. 
    # Requirement says "POST /api/user/xp ... Recalculates and saves power_level"
    # But usually workout also gives XP. Let's do a quick recalc here too.
    
    # Re-fetch user to get updated XP
    updated_user = await db.users.find_one({"email": current_user["email"]})
    new_xp = updated_user.get("xp", 0)
    new_level = 1 + (new_xp // 1000)
    
    if new_level != updated_user.get("power_level"):
        await db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"power_level": new_level}}
        )
        
    return {"success": True, "xp_earned": workout.xp_earned, "new_total_xp": new_xp}

@api_router.get("/user/progress")
async def get_progress(current_user: dict = Depends(get_current_user)):
    return {
        "streaks": current_user.get("streaks", []),
        "recent_workouts": current_user.get("workout_completions", [])[-10:], # Last 10
        "power_level": current_user.get("power_level", 1),
        "xp": current_user.get("xp", 0),
        "level_title": current_user.get("level_title", "Beginner")
    }

@api_router.post("/user/xp")
async def add_xp(xp_data: XPUpdate, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$inc": {"xp": xp_data.amount}}
    )
    
    # Recalculate power level
    updated_user = await db.users.find_one({"email": current_user["email"]})
    new_xp = updated_user.get("xp", 0)
    new_level = 1 + (new_xp // 1000)
    
    update_fields = {"power_level": new_level}
    
    # Update title based on level (Simple logic)
    if new_level >= 50:
        update_fields["level_title"] = "Sigma"
    elif new_level >= 20:
        update_fields["level_title"] = "Alpha"
    elif new_level >= 10:
        update_fields["level_title"] = "Advanced"
    elif new_level >= 5:
        update_fields["level_title"] = "Intermediate"
        
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": update_fields}
    )
    
    return {
        "success": True, 
        "new_xp": new_xp, 
        "new_level": new_level,
        "level_title": update_fields.get("level_title", current_user.get("level_title"))
    }

@api_router.get("/status")
async def root():
    return {"status": "online", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
