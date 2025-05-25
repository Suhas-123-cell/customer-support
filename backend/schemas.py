from pydantic import BaseModel, EmailStr

class CompanyCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    website: str | None = None
    industry: str | None = None
    description: str | None = None
    logo: str | None = None
    password: str

class CompanyResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    website: str | None = None
    industry: str | None = None
    description: str | None = None
    logo: str | None = None
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    user_id: str
    email: EmailStr
    password: str
    company_id: int

class UserResponse(BaseModel):
    id: int
    user_id: str
    email: EmailStr
    company_id: int
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: int | None = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    company_id: int
    class Config:
        from_attributes = True

# Service Schemas
class ServiceBase(BaseModel):
    name: str
    description: str | None = None
    price: int | None = None
    period: str | None = None

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    company_id: int
    class Config:
        from_attributes = True

# FAQ Schemas
class FAQBase(BaseModel):
    question: str
    answer: str

class FAQCreate(FAQBase):
    pass

class FAQResponse(FAQBase):
    id: int
    company_id: int
    class Config:
        from_attributes = True

# Policy Schemas
class PolicyBase(BaseModel):
    title: str
    content: str

class PolicyCreate(PolicyBase):
    pass

class PolicyResponse(PolicyBase):
    id: int
    company_id: int
    class Config:
        from_attributes = True

# Product Question Schemas
class ProductQuestionBase(BaseModel):
    question: str
    customer_id: int

class ProductQuestionCreate(ProductQuestionBase):
    product_id: int

class ProductAnswerBase(BaseModel):
    answer: str
    agent_id: int
    product_id: int

class ProductAnswerCreate(ProductAnswerBase):
    question_id: int

class ProductAnswerResponse(ProductAnswerBase):
    id: int
    question_id: int
    class Config:
        from_attributes = True

# Cart Schemas
class CartItemBase(BaseModel):
    quantity: int = 1

class CartItemCreate(CartItemBase):
    product_id: int | None = None
    service_id: int | None = None

class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    product_id: int | None = None
    service_id: int | None = None
    added_at: str
    class Config:
        from_attributes = True