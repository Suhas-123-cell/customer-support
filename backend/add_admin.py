from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company
from database import DATABASE_URL
import os

# Create the database engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Get the test company
test_company = db.query(Company).filter(Company.name == "Test Company").first()
if not test_company:
    print("Test company not found. Please run seed_fixed.py first.")
    exit(1)

# Create an admin user
admin_user = db.query(User).filter(User.email == "admin@example.com").first()
if not admin_user:
    admin_user = User(
        user_id="admin_user_id",
        email="admin@example.com",
        hashed_password="hashed_password",  # In a real app, this would be properly hashed
        company_id=test_company.id,
        role="Admin"
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print("Admin user created successfully!")
else:
    print("Admin user already exists.")