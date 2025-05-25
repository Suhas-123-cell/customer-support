from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company, Product, Service, FAQ, Policy, CartItem
from database import DATABASE_URL
import os

# Create the database engine
engine = create_engine(DATABASE_URL)

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")