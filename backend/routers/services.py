from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from dependencies import get_current_user_company_id, get_admin_user, get_agent_user, get_customer_user, get_customer_only
from database import get_db

router = APIRouter(
    prefix="/services",
    tags=["services"],
)

@router.post("/", response_model=schemas.ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service: schemas.ServiceCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can create services
):
    db_service = models.Service(**service.model_dump(), company_id=current_company_id)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/", response_model=List[schemas.ServiceResponse])
def read_services(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_user)  # All authenticated users can view services
):
    services = db.query(models.Service).filter(models.Service.company_id == current_company_id).offset(skip).limit(limit).all()
    return services

@router.get("/{service_id}", response_model=schemas.ServiceResponse)
def read_service(
    service_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_user)  # All authenticated users can view a specific service
):
    db_service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.company_id == current_company_id).first()
    if db_service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or not owned by company")
    return db_service

@router.put("/{service_id}", response_model=schemas.ServiceResponse)
def update_service(
    service_id: int, 
    service: schemas.ServiceCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can update services
):
    db_service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.company_id == current_company_id).first()
    if db_service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or not owned by company")
    
    update_data = service.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service, key, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can delete services
):
    db_service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.company_id == current_company_id).first()
    if db_service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or not owned by company")
    db.delete(db_service)
    db.commit()
    return

class BookingResponse(schemas.BaseModel):
    message: str
    service_id: int
    customer_id: int
    success: bool

@router.post("/{service_id}/book", response_model=BookingResponse)
def book_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_only)  # Only customers can book services
):
    # First check if the service exists
    db_service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.company_id == current_company_id).first()
    if db_service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or not owned by company")
    
    # In a real application, you would process the booking and save it to a database
    # For this demo, we'll just return a simulated booking confirmation
    return {
        "message": f"Thank you for booking {db_service.name}. Your booking has been confirmed.",
        "service_id": service_id,
        "customer_id": current_user.id,
        "success": True
    }