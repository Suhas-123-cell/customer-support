from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from dependencies import get_current_user_company_id, get_admin_user, get_agent_user, get_customer_user
from database import get_db

router = APIRouter(
    prefix="/policies",
    tags=["policies"],
)

@router.post("/", response_model=schemas.PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy: schemas.PolicyCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can create policies
):
    db_policy = models.Policy(**policy.model_dump(), company_id=current_company_id)
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.get("/", response_model=List[schemas.PolicyResponse])
def read_policies(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    policies = db.query(models.Policy).filter(models.Policy.company_id == current_company_id).offset(skip).limit(limit).all()
    return policies

@router.get("/{policy_id}", response_model=schemas.PolicyResponse)
def read_policy(
    policy_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id)
):
    db_policy = db.query(models.Policy).filter(models.Policy.id == policy_id, models.Policy.company_id == current_company_id).first()
    if db_policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found or not owned by company")
    return db_policy

@router.put("/{policy_id}", response_model=schemas.PolicyResponse)
def update_policy(
    policy_id: int, 
    policy: schemas.PolicyCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can update policies
):
    db_policy = db.query(models.Policy).filter(models.Policy.id == policy_id, models.Policy.company_id == current_company_id).first()
    if db_policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found or not owned by company")
    
    update_data = policy.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_policy, key, value)
    
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can delete policies
):
    db_policy = db.query(models.Policy).filter(models.Policy.id == policy_id, models.Policy.company_id == current_company_id).first()
    if db_policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found or not owned by company")
    db.delete(db_policy)
    db.commit()
    return 