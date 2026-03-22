from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'maxx_app')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
    
    # Ensure password is preserved (it is already hashed in register)
    # We do NOT delete it here anymore
    
    await db.users.update_one({"email": req.email}, {"$set": user_data}, upsert=True)
    
    # Remove password from response only
    response_user = user_data.copy()
    if "password" in response_user:
        del response_user["password"]
    
    return {
        "access_token": f"jwt_mock_{user_id}",
        "refresh_token": f"refresh_mock_{user_id}",
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
    
    # Remove password from response
    response_user = user.copy()
    if "password" in response_user:
        del response_user["password"]

    return {
        "access_token": f"jwt_mock_{user['id']}",
        "refresh_token": f"refresh_mock_{user['id']}",
        "user": response_user
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
