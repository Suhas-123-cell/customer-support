from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, Company, Product, Service, FAQ, Policy, CartItem
from database import DATABASE_URL
import os

# Create the database engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Create a test company
test_company = db.query(Company).filter(Company.name == "Test Company").first()
if not test_company:
    test_company = Company(
        name="Test Company",
        email="company@example.com",
        hashed_password="hashed_password",  # In a real app, this would be properly hashed
    )
    db.add(test_company)
    db.commit()
    db.refresh(test_company)

# Create a test user
test_user = db.query(User).filter(User.email == "user@example.com").first()
if not test_user:
    test_user = User(
        user_id="test_user_id",
        email="user@example.com",
        hashed_password="hashed_password",  # In a real app, this would be properly hashed
        company_id=test_company.id,
        role="user"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

# Create sample products
products = [
    {"name": "SuperWidget", "description": "Our flagship product with amazing features A and B.", "price": 99.99},
    {"name": "MegaGadget", "description": "Ultra fast with long battery life and AI-powered capabilities.", "price": 199.99},
    {"name": "TechPro X1", "description": "Professional-grade tool for serious users.", "price": 149.99},
    {"name": "SmartHome Hub", "description": "Control all your smart devices from one central location.", "price": 129.99}
]

for product_data in products:
    # Check if product already exists
    existing_product = db.query(Product).filter(
        Product.name == product_data["name"],
        Product.company_id == test_company.id
    ).first()
    
    if not existing_product:
        product = Product(
            name=product_data["name"],
            description=product_data["description"],
            company_id=test_company.id,
            price=product_data["price"]
        )
        db.add(product)

# Create sample services
services = [
    {"name": "Premium Support", "description": "24/7 priority support with 1-hour response time.", "price": 1999, "period": "monthly"},
    {"name": "Installation Service", "description": "Professional installation of your products by certified technicians.", "price": 4999, "period": "one-time"},
    {"name": "Extended Warranty", "description": "Extend your product warranty by an additional 2 years.", "price": 2999, "period": "yearly"},
    {"name": "Training Session", "description": "One-on-one training session to get the most out of your products.", "price": 7999, "period": "one-time"}
]

for service_data in services:
    # Check if service already exists
    existing_service = db.query(Service).filter(
        Service.name == service_data["name"],
        Service.company_id == test_company.id
    ).first()
    
    if not existing_service:
        service = Service(
            name=service_data["name"],
            description=service_data["description"],
            company_id=test_company.id,
            price=service_data["price"],
            period=service_data["period"]
        )
        db.add(service)

# Create sample FAQs
faqs = [
    {"question": "How do I reset my password?", "answer": "You can reset your password by clicking the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password."},
    {"question": "What payment methods do you accept?", "answer": "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for orders over $500."},
    {"question": "How can I track my order?", "answer": "Once your order ships, you'll receive a tracking number via email. You can also view your order status in your account dashboard."},
    {"question": "Do you ship internationally?", "answer": "Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location."},
    {"question": "How do I contact customer support?", "answer": "You can contact our support team via email at support@example.com, by phone at 1-800-EXAMPLE, or through the chat feature on our website."}
]

for faq_data in faqs:
    # Check if FAQ already exists
    existing_faq = db.query(FAQ).filter(
        FAQ.question == faq_data["question"],
        FAQ.company_id == test_company.id
    ).first()
    
    if not existing_faq:
        faq = FAQ(
            question=faq_data["question"],
            answer=faq_data["answer"],
            company_id=test_company.id
        )
        db.add(faq)

# Create sample policies
policies = [
    {"title": "Return Policy", "content": "Products can be returned within 30 days of purchase for a full refund, provided they are in original condition. Opened software is non-refundable."},
    {"title": "Shipping Policy", "content": "Standard shipping takes 3-5 business days. Express shipping (2-day delivery) is available for an additional fee."},
    {"title": "Privacy Policy", "content": "We respect your privacy and are committed to protecting your personal data. We will only use your information to administer your account and provide the products and services you requested from us."},
    {"title": "Terms of Service", "content": "By using our website and services, you agree to these terms. We reserve the right to change these terms at any time, so please check them regularly."}
]

for policy_data in policies:
    # Check if policy already exists
    existing_policy = db.query(Policy).filter(
        Policy.title == policy_data["title"],
        Policy.company_id == test_company.id
    ).first()
    
    if not existing_policy:
        policy = Policy(
            title=policy_data["title"],
            content=policy_data["content"],
            company_id=test_company.id
        )
        db.add(policy)

# Commit all changes
db.commit()

print("Database seeded successfully!")