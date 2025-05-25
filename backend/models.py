from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = 'companies'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    description = Column(String, nullable=True)
    logo = Column(String, nullable=True)  # store file path or URL
    hashed_password = Column(String, nullable=False)
    users = relationship('User', back_populates='company')
    products = relationship('Product', back_populates='company', cascade="all, delete-orphan")
    services = relationship('Service', back_populates='company', cascade="all, delete-orphan")
    faqs = relationship('FAQ', back_populates='company', cascade="all, delete-orphan")
    policies = relationship('Policy', back_populates='company', cascade="all, delete-orphan")

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'))
    role = Column(String, nullable=False, default='Customer')
    company = relationship('Company', back_populates='users')
    # Add relationships for product questions and answers
    product_questions = relationship('ProductQuestion', foreign_keys='ProductQuestion.customer_id', backref='customer')
    product_answers = relationship('ProductAnswer', foreign_keys='ProductAnswer.agent_id', backref='agent')

class Product(Base):
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Integer, nullable=True)  # Store price in cents
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    company = relationship('Company', back_populates='products')
    questions = relationship('ProductQuestion', backref='product', cascade="all, delete-orphan")
    answers = relationship('ProductAnswer', backref='product', cascade="all, delete-orphan")

class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Integer, nullable=True)  # Store price in cents
    period = Column(String, nullable=True)  # monthly, yearly, one-time
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    company = relationship('Company', back_populates='services')

class FAQ(Base):
    __tablename__ = 'faqs'
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    company = relationship('Company', back_populates='faqs')

class Policy(Base):
    __tablename__ = 'policies'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    company = relationship('Company', back_populates='policies')

class ProductQuestion(Base):
    __tablename__ = 'product_questions'
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    customer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    answers = relationship('ProductAnswer', back_populates='question', cascade="all, delete-orphan")
    
class ProductAnswer(Base):
    __tablename__ = 'product_answers'
    id = Column(Integer, primary_key=True, index=True)
    answer = Column(String, nullable=False)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('product_questions.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    question = relationship('ProductQuestion', back_populates='answers')

class CartItem(Base):
    __tablename__ = 'cart_items'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    added_at = Column(String, nullable=False)  # Store timestamp as string
    user = relationship('User', backref='cart_items')
    product = relationship('Product', backref='cart_items')
    service = relationship('Service', backref='cart_items')