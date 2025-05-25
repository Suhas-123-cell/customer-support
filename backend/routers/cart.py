from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
from datetime import datetime
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from dependencies import get_current_user_company_id, get_customer_only, get_customer_user
from database import get_db

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
)

@router.post("/items", response_model=schemas.CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_customer_user)  # All users can add to cart
):
    print(f"Adding item to cart: {item}")
    print(f"Current user: {current_user.email}, role: {current_user.role}, company_id: {current_user.company_id}")
    # Validate that either product_id or service_id is provided, but not both
    if (item.product_id is None and item.service_id is None) or (item.product_id is not None and item.service_id is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either product_id or service_id must be provided, but not both"
        )
    
    # Check if the product or service exists and belongs to the user's company
    if item.product_id:
        db_product = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.company_id == current_user.company_id
        ).first()
        if db_product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or not available to your company"
            )
    
    if item.service_id:
        db_service = db.query(models.Service).filter(
            models.Service.id == item.service_id,
            models.Service.company_id == current_user.company_id
        ).first()
        if db_service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found or not available to your company"
            )
    
    # Check if the item is already in the cart
    existing_item = None
    if item.product_id:
        existing_item = db.query(models.CartItem).filter(
            models.CartItem.user_id == current_user.id,
            models.CartItem.product_id == item.product_id
        ).first()
    elif item.service_id:
        existing_item = db.query(models.CartItem).filter(
            models.CartItem.user_id == current_user.id,
            models.CartItem.service_id == item.service_id
        ).first()
    
    # If the item is already in the cart, update the quantity
    if existing_item:
        existing_item.quantity += item.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    # Otherwise, create a new cart item
    timestamp = datetime.now().isoformat()
    print(f"Creating new cart item with timestamp: {timestamp}")
    print(f"User ID: {current_user.id}")
    print(f"Product ID: {item.product_id}")
    print(f"Service ID: {item.service_id}")
    print(f"Quantity: {item.quantity}")
    
    db_item = models.CartItem(
        user_id=current_user.id,
        product_id=item.product_id,
        service_id=item.service_id,
        quantity=item.quantity,
        added_at=timestamp
    )
    
    print(f"Created cart item: {db_item.__dict__}")
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    print(f"Saved cart item: {db_item.__dict__}")
    
    return db_item

@router.get("/items", response_model=List[schemas.CartItemResponse])
def get_cart_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_customer_user)  # All users can view their cart
):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    return cart_items

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_customer_user)  # All users can remove items from their cart
):
    db_item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found or not owned by user"
        )
    
    db.delete(db_item)
    db.commit()
    return

@router.put("/items/{item_id}", response_model=schemas.CartItemResponse)
def update_cart_item(
    item_id: int,
    item: schemas.CartItemBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_customer_user)  # All users can update their cart
):
    db_item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found or not owned by user"
        )
    
    # Update the quantity
    db_item.quantity = item.quantity
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/checkout", status_code=status.HTTP_200_OK)
def checkout(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_customer_only)  # Only customers can checkout
):
    # Get all cart items for the user
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # In a real application, you would process the order here
    # For this demo, we'll just clear the cart
    for item in cart_items:
        db.delete(item)
    
    db.commit()
    
    return {"message": "Checkout successful. Your order has been placed."}