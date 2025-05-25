from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt # Changed from 'import jwt' to 'from jose import jwt'
import sys
import os
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import models
import schemas
from config import settings
from database import get_db
from typing import List, Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login") # Adjusted tokenUrl to match your user router

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # For testing: Accept mock token
    if token == "mock_token_for_testing":
        # Get the role from localStorage on the frontend
        # For testing, we'll check if the user exists in the database
        
        # Create a test company first if it doesn't exist
        test_company = db.query(models.Company).filter(models.Company.name == "Test Company").first()
        if not test_company:
            test_company = models.Company(
                name="Test Company",
                email="company@example.com",
                hashed_password="hashed_password",  # In a real app, this would be properly hashed
            )
            db.add(test_company)
            db.commit()
            db.refresh(test_company)
        
        # Check for admin user
        admin_user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
        if not admin_user:
            admin_user = models.User(
                user_id="admin_user_id",
                email="admin@example.com",
                hashed_password="hashed_password",  # In a real app, this would be properly hashed
                company_id=test_company.id,
                role="Admin"  # Note the capital A
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        
        # Check for regular user
        test_user = db.query(models.User).filter(models.User.email == "user@example.com").first()
        if not test_user:
            test_user = models.User(
                user_id="test_user_id",
                email="user@example.com",
                hashed_password="hashed_password",  # In a real app, this would be properly hashed
                company_id=test_company.id,
                role="Customer"
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Check for agent user
        agent_user = db.query(models.User).filter(models.User.email == "agent@example.com").first()
        if not agent_user:
            agent_user = models.User(
                user_id="agent_user_id",
                email="agent@example.com",
                hashed_password="hashed_password",  # In a real app, this would be properly hashed
                company_id=test_company.id,
                role="Agent"
            )
            db.add(agent_user)
            db.commit()
            db.refresh(agent_user)
        
        # Return the appropriate user based on the email in localStorage
        # For simplicity, we'll return the admin user for now
        return admin_user
    
    # Normal JWT validation for real tokens
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user_id: str = payload.get("user_id") # if you need user_id
        company_id: int = int(payload.get("company_id")) # ensure company_id is int
        if user_id is None or company_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    # You can return the full user object or just specific parts like company_id
    # For company-specific resources, returning an object that includes company_id is useful.
    return user # Return the full user model

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    # If you have an is_active field on your user model, you can check it here.
    # For now, just returning the user from get_current_user is fine.
    # if not current_user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Dependency to get company_id of the current user
async def get_current_user_company_id(current_user: models.User = Depends(get_current_active_user)) -> int:
    if current_user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User is not associated with a company"
        )
    return current_user.company_id

# Role-based access control dependencies
def get_user_with_roles(allowed_roles: List[str]):
    async def check_user_role(current_user: models.User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_user_role

# Specific role dependencies
get_admin_user = get_user_with_roles(["Admin", "admin"])
get_agent_user = get_user_with_roles(["Admin", "admin", "Agent", "agent"])  # Admins can do everything agents can
get_customer_user = get_user_with_roles(["Admin", "admin", "Agent", "agent", "Customer", "customer", "user"])  # All authenticated users
get_customer_only = get_user_with_roles(["Customer", "customer", "user"])  # Only customers can buy products 