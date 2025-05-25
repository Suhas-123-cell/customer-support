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
    prefix="/products",
    tags=["products"],
    # dependencies=[Depends(get_current_active_user)] # You can add global auth here if all routes need it
)

@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can create products
):
    db_product = models.Product(**product.model_dump(), company_id=current_company_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[schemas.ProductResponse])
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_user)  # All authenticated users can view products
):
    products = db.query(models.Product).filter(models.Product.company_id == current_company_id).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_user)  # All authenticated users can view a specific product
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.company_id == current_company_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or not owned by company")
    return db_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can update products
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.company_id == current_company_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or not owned by company")
    
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_admin_user)  # Only admins can delete products
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.company_id == current_company_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or not owned by company")
    db.delete(db_product)
    db.commit()
    return 

# Schema for product questions
class ProductQuestion(schemas.BaseModel):
    question: str
    customer_id: int

class ProductAnswer(schemas.BaseModel):
    answer: str
    agent_id: int
    product_id: int

class PurchaseResponse(schemas.BaseModel):
    message: str
    product_id: int
    customer_id: int
    success: bool

@router.post("/{product_id}/answer", response_model=ProductAnswer)
def answer_product_question(
    product_id: int,
    question: ProductQuestion,
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_agent_user)  # Only agents and admins can answer questions
):
    # First check if the product exists
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.company_id == current_company_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or not owned by company")
    
    # In a real application, you would save the question and answer to a database
    # For this demo, we'll just return a simulated answer
    return {
        "answer": f"Thank you for your question about {db_product.name}. Our team will get back to you shortly.",
        "agent_id": current_user.id,
        "product_id": product_id
    }

@router.post("/{product_id}/purchase", response_model=PurchaseResponse)
def purchase_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_company_id: int = Depends(get_current_user_company_id),
    current_user: models.User = Depends(get_customer_only)  # Only customers can purchase products
):
    # First check if the product exists
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.company_id == current_company_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or not owned by company")
    
    # In a real application, you would process the purchase and save it to a database
    # For this demo, we'll just return a simulated purchase confirmation
    return {
        "message": f"Thank you for purchasing {db_product.name}. Your order has been confirmed.",
        "product_id": product_id,
        "customer_id": current_user.id,
        "success": True
    }