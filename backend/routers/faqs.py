from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas
from backend.dependencies import get_current_user_company_id
from backend.database import get_db

router = APIRouter(
    prefix="/faqs",
    tags=["faqs"],
)

@router.post("/", response_model=schemas.FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    faq: schemas.FAQCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    db_faq = models.FAQ(**faq.model_dump(), company_id=current_company_id)
    db.add(db_faq)
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.get("/", response_model=List[schemas.FAQResponse])
def read_faqs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    faqs = db.query(models.FAQ).filter(models.FAQ.company_id == current_company_id).offset(skip).limit(limit).all()
    return faqs

@router.get("/{faq_id}", response_model=schemas.FAQResponse)
def read_faq(
    faq_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id, models.FAQ.company_id == current_company_id).first()
    if db_faq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found or not owned by company")
    return db_faq

@router.put("/{faq_id}", response_model=schemas.FAQResponse)
def update_faq(
    faq_id: int, 
    faq: schemas.FAQCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id, models.FAQ.company_id == current_company_id).first()
    if db_faq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found or not owned by company")
    
    update_data = faq.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_faq, key, value)
    
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id, models.FAQ.company_id == current_company_id).first()
    if db_faq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found or not owned by company")
    db.delete(db_faq)
    db.commit()
    return 