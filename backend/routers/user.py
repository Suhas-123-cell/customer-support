from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from passlib.context import CryptContext
from datetime import timedelta, datetime, timezone
from config import settings
from jose import jwt as jose_jwt
from database import get_db
import os

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jose_jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=schemas.UserResponse)
async def register_user(
    fullName: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    department: str = Form(None),
    companyCode: str = Form(...),
    profilePic: UploadFile = File(None),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Registering user: {fullName}, {email}, {role}, {department}, {companyCode}, profilePic={profilePic.filename if profilePic else None}")
        # Use fullName as user_id, companyCode as company_id or company name
        user_id = fullName.strip().replace(" ", "_").lower()
        # Try to interpret companyCode as an integer ID first
        company_id = None
        db_company = None
        try:
            company_id = int(companyCode)
            db_company = db.query(models.Company).filter(models.Company.id == company_id).first()
        except ValueError:
            # If not an integer, try to find by name (case-insensitive)
            normalized_name = companyCode.strip().lower()
            db_company = db.query(models.Company).filter(func.lower(models.Company.name) == normalized_name).first()
            if db_company:
                company_id = db_company.id
        if not db_company:
            print("Company not found for companyCode:", companyCode)
            raise HTTPException(status_code=404, detail="Company not found")
        if not user_id.startswith(db_company.name.lower()):
            print(f"User ID '{user_id}' does not start with company name '{db_company.name}'")
            raise HTTPException(status_code=400, detail=f"User ID must start with the company name: '{db_company.name}'")
        db_user_by_id = db.query(models.User).filter(models.User.user_id == user_id).first()
        if db_user_by_id:
            print("User ID already exists:", user_id)
            raise HTTPException(status_code=400, detail="User ID already exists")
        db_user_by_email = db.query(models.User).filter(models.User.email == email).first()
        if db_user_by_email:
            print("Email already registered:", email)
            raise HTTPException(status_code=400, detail="Email already registered")
        profile_pic_path = None
        if profilePic:
            pic_dir = "uploaded_profiles"
            os.makedirs(pic_dir, exist_ok=True)
            profile_pic_path = os.path.join(pic_dir, profilePic.filename)
            with open(profile_pic_path, "wb") as f:
                f.write(await profilePic.read())
        hashed_password = pwd_context.hash(password)
        new_user = models.User(user_id=user_id, email=email, hashed_password=hashed_password, company_id=company_id, role=role)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User registered: {new_user.id}")
        return schemas.UserResponse(
            id=new_user.id,
            user_id=new_user.user_id,
            email=new_user.email,
            company_id=new_user.company_id,
        )
    except Exception as e:
        print(f"User registration error: {e}")
        raise

@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.user_id, "company_id": str(user.company_id)},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": getattr(user, "role", None)
    }

@router.get("/list/{company_id}", response_model=list[schemas.UserResponse])
def list_users(company_id: int, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.company_id == company_id).all()
    return users 