from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from database import get_db
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=schemas.CompanyResponse)
async def register_company(
    companyName: str = Form(...),
    companyEmail: str = Form(...),
    phone: str = Form(None),
    website: str = Form(None),
    industry: str = Form(None),
    description: str = Form(None),
    logo: UploadFile = File(None),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Registering company: {companyName}, {companyEmail}, {phone}, {website}, {industry}, {description}, logo={logo.filename if logo else None}")
        normalized_name = companyName.strip().lower()
        db_company = db.query(models.Company).filter(models.Company.name == normalized_name).first()
        if db_company:
            print("Company name already registered")
            raise HTTPException(status_code=400, detail="Company name already registered")
        db_email = db.query(models.Company).filter(models.Company.email == companyEmail).first()
        if db_email:
            print("Company email already registered")
            raise HTTPException(status_code=400, detail="Company email already registered")
        logo_path = None
        if logo:
            logo_dir = "uploaded_logos"
            os.makedirs(logo_dir, exist_ok=True)
            logo_path = os.path.join(logo_dir, logo.filename)
            with open(logo_path, "wb") as f:
                f.write(await logo.read())
        hashed_password = pwd_context.hash(password)
        new_company = models.Company(
            name=normalized_name,
            email=companyEmail,
            phone=phone,
            website=website,
            industry=industry,
            description=description,
            logo=logo_path,
            hashed_password=hashed_password
        )
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        print(f"Company registered: {new_company.id}")
        return schemas.CompanyResponse(
            id=new_company.id,
            name=new_company.name,
            email=new_company.email,
            phone=new_company.phone,
            website=new_company.website,
            industry=new_company.industry,
            description=new_company.description,
            logo=new_company.logo,
        )
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-name/{name}", response_model=schemas.CompanyResponse)
def get_company_by_name(name: str, db: Session = Depends(get_db)):
    db_company = db.query(models.Company).filter(
        func.lower(models.Company.name) == name.strip().lower()
    ).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company 