from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from routers import company, user, products, services, policies, faqs, cart # Import all routers
from database import get_db
from sqlalchemy.orm import Session
import models
import os
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import json # For pretty printing chat history or KB items if needed

# Load environment variables from both root and backend directories
load_dotenv()  # Load from root .env
load_dotenv("backend/.env")  # Also load from backend/.env

# Get API keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Print API key status for debugging
print(f"HUGGINGFACE_API_KEY present: {HUGGINGFACE_API_KEY is not None}")
if HUGGINGFACE_API_KEY:
    print(f"Hugging Face API key found: {HUGGINGFACE_API_KEY[:5]}...{HUGGINGFACE_API_KEY[-5:]}")
else:
    print("Error: HUGGINGFACE_API_KEY not found in any .env file. Chatbot functionality will be impaired.")

# We're using Hugging Face exclusively now
print("Using Hugging Face API exclusively for AI services.")

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Print CORS configuration for debugging
print("CORS Configuration:")
print("allow_origins: ['*']")
print("allow_credentials: True")
print("allow_methods: ['*']")
print("allow_headers: ['*']")

# Include all routers
app.include_router(company.router, prefix="/api/companies", tags=["Companies"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(policies.router, prefix="/api")
app.include_router(faqs.router, prefix="/api")
app.include_router(cart.router, prefix="/api")

# Define API root route
@app.get("/api", response_class=JSONResponse)
async def api_root():
    return {
        "message": "Welcome to the Customer Support API",
        "documentation": "/docs",
        "available_endpoints": [
            "/api/companies", 
            "/api/users", 
            "/api/products", 
            "/api/services", 
            "/api/policies", 
            "/api/faqs", 
            "/api/cart"
        ]
    }

# Root route that serves the frontend
@app.get("/", response_class=HTMLResponse)
async def root():
    # Path to the index.html file
    index_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist", "index.html")
    
    # Check if the file exists
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            return f.read()
    else:
        # Fallback if index.html doesn't exist
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Customer Support API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                .api-link { display: inline-block; margin-top: 20px; padding: 10px 20px; 
                           background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
                .api-link:hover { background-color: #45a049; }
            </style>
        </head>
        <body>
            <h1>Customer Support Application</h1>
            <p>The frontend is not available. This could be because:</p>
            <ul>
                <li>The frontend build process failed</li>
                <li>The frontend files are not in the expected location</li>
            </ul>
            <p>You can still access the API directly:</p>
            <a class="api-link" href="/api">API Documentation</a>
        </body>
        </html>
        """

# Health check endpoint
@app.get("/api/health", response_class=JSONResponse)
async def health_check():
    return {"status": "healthy"}

# Test GET endpoint
@app.get("/api/test")
async def test_get_endpoint():
    return {"message": "GET request successful"}

# Test POST endpoint
@app.post("/api/test")
async def test_post_endpoint():
    return {"message": "POST request successful"}

# JSON login endpoint
@app.post("/api/json-login")
async def json_login(request: Request):
    try:
        # Get JSON data
        body = await request.json()
        username = body.get("username", "")
        password = body.get("password", "")
        
        print(f"JSON login attempt with username: {username}")
        
        # Demo accounts for testing
        if username == 'admin@example.com' and password == 'admin123':
            print("Using admin demo account")
            return {
                "access_token": "demo_token_for_admin",
                "token_type": "bearer",
                "role": "Admin"
            }
        elif username == 'user@example.com' and password == 'user123':
            print("Using user demo account")
            return {
                "access_token": "demo_token_for_user",
                "token_type": "bearer",
                "role": "Customer"
            }
        elif username == 'agent@example.com' and password == 'agent123':
            print("Using agent demo account")
            return {
                "access_token": "demo_token_for_agent",
                "token_type": "bearer",
                "role": "Agent"
            }
        
        # Check for registered accounts in the database
        try:
            from routers.user import verify_password, create_access_token
            from datetime import timedelta
            from config import settings
            
            # Get database session
            db = next(get_db())
            
            # Check if user exists
            user = db.query(models.User).filter(models.User.email == username).first()
            
            if user:
                print(f"Found registered user: {username}")
                
                # Verify password
                if verify_password(password, user.hashed_password):
                    print(f"Password verified for user: {username}")
                    
                    # Create access token
                    ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
                    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = create_access_token(
                        data={"sub": user.email, "user_id": user.user_id, "company_id": str(user.company_id)},
                        expires_delta=access_token_expires
                    )
                    
                    return {
                        "access_token": access_token,
                        "token_type": "bearer",
                        "role": getattr(user, "role", "Customer")
                    }
                else:
                    print(f"Password verification failed for user: {username}")
            else:
                print(f"User not found: {username}")
        except Exception as db_error:
            print(f"Database error during login: {db_error}")
        
        # For any other account, just accept it in demo mode
        print(f"Accepting login for {username} in demo mode")
        return {
            "access_token": f"demo_token_for_{username}",
            "token_type": "bearer",
            "role": "Customer"  # Default role
        }
    except Exception as e:
        print(f"JSON login error: {e}")
        return {
            "access_token": "emergency_fallback_token",
            "token_type": "bearer",
            "role": "Customer"
        }

# Test form submission endpoint
@app.post("/api/test-form")
async def test_form_endpoint(form_data: OAuth2PasswordRequestForm = Depends()):
    return {
        "message": "Form submission successful",
        "username": form_data.username,
        "password_length": len(form_data.password) if form_data.password else 0
    }

# Simple login endpoint that accepts both GET and POST
@app.get("/api/simple-login")
@app.post("/api/simple-login")
async def simple_login(request: Request):
    print(f"Simple login attempt with method: {request.method}")
    
    try:
        # Get username and password from query params or form data
        if request.method == "GET":
            username = request.query_params.get("username", "")
            password = request.query_params.get("password", "")
            print(f"GET login with username: {username}")
        else:  # POST
            try:
                # Try to get JSON data first
                body = await request.json()
                username = body.get("username", "")
                password = body.get("password", "")
                print(f"POST JSON login with username: {username}")
            except:
                try:
                    # Try to get form data
                    form = await request.form()
                    username = form.get("username", "")
                    password = form.get("password", "")
                    print(f"POST form login with username: {username}")
                except:
                    # Try to get raw body
                    body_bytes = await request.body()
                    body_str = body_bytes.decode()
                    print(f"Raw body: {body_str}")
                    
                    # Parse URL-encoded form data manually
                    params = {}
                    for param in body_str.split("&"):
                        if "=" in param:
                            key, value = param.split("=", 1)
                            params[key] = value
                    
                    username = params.get("username", "")
                    password = params.get("password", "")
                    print(f"POST raw body login with username: {username}")
        
        # Demo accounts for testing - always allow these to work
        if username == 'admin@example.com' and password == 'admin123':
            print("Using admin demo account")
            return {
                "access_token": "demo_token_for_admin",
                "token_type": "bearer",
                "role": "Admin"
            }
        elif username == 'user@example.com' and password == 'user123':
            print("Using user demo account")
            return {
                "access_token": "demo_token_for_user",
                "token_type": "bearer",
                "role": "Customer"
            }
        elif username == 'agent@example.com' and password == 'agent123':
            print("Using agent demo account")
            return {
                "access_token": "demo_token_for_agent",
                "token_type": "bearer",
                "role": "Agent"
            }
        
        # Check for registered accounts in the database
        try:
            from routers.user import verify_password, create_access_token
            from datetime import timedelta
            from config import settings
            
            # Get database session
            db = next(get_db())
            
            # Check if user exists
            user = db.query(models.User).filter(models.User.email == username).first()
            
            if user:
                print(f"Found registered user: {username}")
                
                # Verify password
                if verify_password(password, user.hashed_password):
                    print(f"Password verified for user: {username}")
                    
                    # Create access token
                    ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
                    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = create_access_token(
                        data={"sub": user.email, "user_id": user.user_id, "company_id": str(user.company_id)},
                        expires_delta=access_token_expires
                    )
                    
                    return {
                        "access_token": access_token,
                        "token_type": "bearer",
                        "role": getattr(user, "role", "Customer")
                    }
                else:
                    print(f"Password verification failed for user: {username}")
            else:
                print(f"User not found: {username}")
        except Exception as db_error:
            print(f"Database error during login: {db_error}")
        
        # For any other account, just accept it in demo mode
        print(f"Accepting login for {username} in demo mode")
        return {
            "access_token": f"demo_token_for_{username}",
            "token_type": "bearer",
            "role": "Customer"  # Default role
        }
    except Exception as e:
        print(f"Simple login error: {e}")
        # Return a success response anyway for testing
        return {
            "access_token": "emergency_fallback_token",
            "token_type": "bearer",
            "role": "Customer"
        }

# Mount static files for assets (CSS, JS, images)
static_files_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist", "assets")
if os.path.exists(static_files_path):
    app.mount("/assets", StaticFiles(directory=static_files_path), name="assets")
    print(f"Static assets mounted from {static_files_path}")
else:
    print(f"Warning: Static assets directory not found at {static_files_path}")

# Add a catch-all route to handle client-side routing
@app.get("/{full_path:path}")
async def catch_all(full_path: str, request: Request):
    # Skip API routes - don't handle them here
    if full_path.startswith("api/") or full_path == "api" or full_path in ["docs", "redoc", "openapi.json"]:
        print(f"API route detected in catch_all: {full_path}, method: {request.method}")
        raise HTTPException(status_code=404, detail="API route not found")
    
    # Serve the index.html for all other routes to support client-side routing
    index_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            return HTMLResponse(content=f.read())
    else:
        raise HTTPException(status_code=404, detail="Frontend not built")

# --- Chatbot Specific Code ---

# 1. In-memory Knowledge Base (KB)
knowledge_base = [
    {"type": "faq", "id": "faq_hours", "question": "What are your business hours?", "answer": "We are open 9 AM to 5 PM, Monday to Friday."},
    {"type": "faq", "id": "faq_password", "question": "How can I reset my password?", "answer": "You can reset your password by clicking the 'Forgot Password' link on the login page."},
    {"type": "faq", "id": "faq_contact", "question": "How can I contact support?", "answer": "You can contact support via email at support@example.com or by calling us at 1-800-EXAMPLE."}, 
    {"type": "product", "id": "prod_widget", "name": "SuperWidget", "description": "An amazing widget that does everything you need.", "price": "$99.99", "features": ["Feature A", "Feature B"]},
    {"type": "product", "id": "prod_gadget", "name": "MegaGadget", "description": "The latest and greatest gadget on the market.", "price": "$199.99", "features": ["Ultra fast", "Long battery life", "AI-powered"]},
    {"type": "service", "id": "serv_support", "name": "Premium Support Plan", "description": "24/7 premium support for all your needs.", "details": "Includes priority phone and email support, and a dedicated account manager."},
    {"type": "policy", "id": "pol_return", "title": "Return Policy", "content": "Products can be returned within 30 days of purchase for a full refund, provided they are in original condition. Opened software is non-refundable."},
]

# 2. KB Search Functionality (simple keyword matching for demonstration)
def search_knowledge_base(query: str) -> list:
    query_lower = query.lower()
    results = []
    for item in knowledge_base:
        # Check if item already matches in common fields
        common_fields_match = (
            query_lower in item.get("question", "").lower() or
            query_lower in item.get("answer", "").lower() or
            query_lower in item.get("name", "").lower() or
            query_lower in item.get("description", "").lower() or
            query_lower in item.get("title", "").lower() or
            query_lower in item.get("content", "").lower()
        )
        
        if common_fields_match:
            results.append(item)
            continue  # Skip to next item since we already added this one
            
        # Check in features list if it exists
        if any(query_lower in feature.lower() for feature in item.get("features", [])):
            if item not in results:  # Avoid adding duplicates if already matched by common fields
                results.append(item)
    
    return results[:3]  # Return top 3 matches
def get_user_details(db: Session, customer_id: str) -> dict:
    """
    Fetch comprehensive user details including personal info, cart items, and purchase history.
    
    Args:
        db: Database session
        customer_id: User ID or email of the customer
    
    Returns:
        Dictionary containing user details
    """
    try:
        # Find the user by user_id or email
        user = None
        if "@" in customer_id:  # If it looks like an email
            user = db.query(models.User).filter(models.User.email == customer_id).first()
        else:
            user = db.query(models.User).filter(models.User.user_id == customer_id).first()
        
        if not user:
            return {"error": f"User with ID or email '{customer_id}' not found"}
        
        # Get company details
        company = db.query(models.Company).filter(models.Company.id == user.company_id).first()
        company_name = company.name if company else "Unknown Company"
        
        # Get current cart items
        cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user.id).all()
        
        cart_details = []
        for item in cart_items:
            item_details = {"quantity": item.quantity, "added_at": item.added_at}
            
            if item.product_id:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    item_details.update({
                        "type": "product",
                        "id": product.id,
                        "name": product.name,
                        "description": product.description,
                        "price": product.price
                    })
            
            if item.service_id:
                service = db.query(models.Service).filter(models.Service.id == item.service_id).first()
                if service:
                    item_details.update({
                        "type": "service",
                        "id": service.id,
                        "name": service.name,
                        "description": service.description,
                        "price": service.price,
                        "period": service.period
                    })
            
            cart_details.append(item_details)
        
        # Get user questions
        questions = db.query(models.ProductQuestion).filter(models.ProductQuestion.customer_id == user.id).all()
        question_details = []
        
        for q in questions:
            product = db.query(models.Product).filter(models.Product.id == q.product_id).first()
            product_name = product.name if product else "Unknown Product"
            
            answers = db.query(models.ProductAnswer).filter(models.ProductAnswer.question_id == q.id).all()
            answer_texts = [a.answer for a in answers]
            
            question_details.append({
                "product_name": product_name,
                "question": q.question,
                "answers": answer_texts
            })
        
        # Compile all user details
        user_details = {
            "personal_info": {
                "id": user.id,
                "user_id": user.user_id,
                "email": user.email,
                "role": user.role,
                "company": company_name,
                "company_id": user.company_id
            },
            "cart": {
                "item_count": len(cart_details),
                "items": cart_details
            },
            "questions": question_details
        }
        
        return user_details
    
    except Exception as e:
        print(f"Error fetching user details: {e}")
        return {"error": f"Failed to fetch user details: {str(e)}"}
        # For products, also check features
        if item.get("type") == "product" and "features" in item:
            if any(query_lower in feature.lower() for feature in item.get("features", [])):
                if item not in results: # Avoid adding duplicates if already matched by common fields
                    results.append(item)
    return results[:3] # Return top 3 matches 

# 3. Chat History (in-memory, simple implementation for demonstration)
# Key: user_id, Value: list of messages ({"role": "user/assistant", "content": "..."})
chat_histories = {}
MAX_HISTORY_LEN = 10 # Max number of messages (user + assistant) to keep in history for LLM context

class ChatRequest(BaseModel):
    user_id: str
    message: str

class AgentChatRequest(BaseModel):
    agent_id: str
    customer_id: str
    message: str
    
class AgentAssistRequest(BaseModel):
    agent_id: str
    conversation_context: str
    query: str
    
class TicketSummaryRequest(BaseModel):
    agent_id: str
    conversation_history: str
    
class ResponseDraftRequest(BaseModel):
    agent_id: str
    customer_query: str
    relevant_info: str = ""
    tone: str = "professional"  # Options: professional, friendly, technical, simple

async def call_ai_service(prompt_messages: list):
    """
    Call AI service using Hugging Face API exclusively
    """
    # Use Hugging Face API only
    if HUGGINGFACE_API_KEY:
        try:
            return await call_huggingface_ai(prompt_messages)
        except Exception as e:
            print(f"Error with Hugging Face API: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error with Hugging Face API: {str(e)}"
            )
    else:
        print("No Hugging Face API key configured")
        raise HTTPException(
            status_code=500, 
            detail="Hugging Face API key not configured. Please add HUGGINGFACE_API_KEY to your .env file."
        )

async def call_huggingface_ai(prompt_messages: list):
    """
    Call Hugging Face's inference API for chat completion
    """
    if not HUGGINGFACE_API_KEY:
        print("Attempted to call Hugging Face AI without API key.")
        raise HTTPException(status_code=500, detail="Hugging Face API key not configured.")
    
    # Convert chat format to text format that Hugging Face models expect
    prompt_text = ""
    for message in prompt_messages:
        role = message["role"]
        content = message["content"]
        
        if role == "system":
            prompt_text += f"System: {content}\n\n"
        elif role == "user":
            prompt_text += f"User: {content}\n\n"
        elif role == "assistant":
            prompt_text += f"Assistant: {content}\n\n"
    
    # Add final assistant prompt
    prompt_text += "Assistant: "
    
    print(f"Prepared prompt text (first 100 chars): {prompt_text[:100]}...")
    
    # Use a good open-source model from Hugging Face
    model_id = "mistralai/Mixtral-8x7B-Instruct-v0.1"  # A more powerful model
    
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt_text,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True
        }
    }
    
    print(f"Calling Hugging Face API with model: {model_id}")
    
    async with httpx.AsyncClient() as client:
        try:
            print("Sending request to Hugging Face API...")
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            print(f"Received response with status code: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error response from Hugging Face: {response.text}")
                response.raise_for_status()
            
            response_data = response.json()
            
            # Handle different response formats from Hugging Face
            if isinstance(response_data, list) and len(response_data) > 0:
                # Some models return a list of outputs
                generated_text = response_data[0].get("generated_text", "")
                
                # Extract just the assistant's response
                if "Assistant: " in generated_text:
                    # Get everything after the last "Assistant: "
                    assistant_response = generated_text.split("Assistant: ")[-1].strip()
                else:
                    assistant_response = generated_text
                
                print(f"Successfully received content from Hugging Face: {assistant_response[:50]}...")
                return assistant_response
            elif isinstance(response_data, dict):
                # Some models return a dictionary
                generated_text = response_data.get("generated_text", "")
                print(f"Successfully received content from Hugging Face: {generated_text[:50]}...")
                return generated_text
            else:
                print(f"Unexpected Hugging Face API response structure: {response_data}")
                raise HTTPException(status_code=502, detail="Invalid response structure from Hugging Face API.")
                
        except httpx.ReadTimeout:
            print("Hugging Face API request timed out.")
            raise HTTPException(status_code=504, detail="Request to Hugging Face API timed out.")
        except httpx.HTTPStatusError as e:
            error_detail_msg = f"Hugging Face API error: {e.response.status_code}. Response: {e.response.text[:200]}..."
            print(error_detail_msg)
            raise HTTPException(status_code=502, detail=f"Error communicating with Hugging Face API: {e.response.status_code}. Please try again later.")
        except Exception as e:
            print(f"An unexpected error occurred while calling Hugging Face AI: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred with the Hugging Face API: {str(e)}")

async def call_groq_ai(prompt_messages: list):
    """
    Call Groq AI as a fallback option
    """
    if not GROQ_API_KEY:
        print("Attempted to call Groq AI without API key.")
        raise HTTPException(status_code=500, detail="Groq API key not configured.")
    
    url = "https://api.groq.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # For debugging
    print(f"Using GROQ API KEY: {GROQ_API_KEY[:5]}...{GROQ_API_KEY[-5:]}")
    
    # Check if the model is available
    model = "llama3-70b-8192"
    print(f"Using model: {model}")
    
    payload = {
        "model": model,
        "messages": prompt_messages,
        "temperature": 0.6, # Lower temperature for more factual, less creative responses
        "max_tokens": 1024 # Adjust as needed
    }
    
    # For debugging - print the first and last message
    if prompt_messages:
        print(f"First message role: {prompt_messages[0]['role']}")
        print(f"Last message: {prompt_messages[-1]['content'][:50]}...")
    
    async with httpx.AsyncClient() as client:
        try:
            print("Sending request to Groq API...")
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            print(f"Received response with status code: {response.status_code}")
            
            # For debugging
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                
            response.raise_for_status() # Raises HTTPStatusError for 4xx/5xx responses
            
            # Check if choices are present and valid
            response_data = response.json()
            print(f"Response data keys: {response_data.keys()}")
            
            if not response_data.get("choices") or not response_data["choices"][0].get("message"):
                print(f"Unexpected Groq API response structure: {response_data}")
                raise HTTPException(status_code=502, detail="Invalid response structure from Groq API.")
            
            content = response_data["choices"][0]["message"]["content"]
            print(f"Successfully received content from Groq: {content[:50]}...")
            return content
            
        except httpx.ReadTimeout:
            print("Groq API request timed out.")
            raise HTTPException(status_code=504, detail="Request to Groq API timed out.")
        except httpx.HTTPStatusError as e:
            error_detail_msg = f"Groq API error: {e.response.status_code}. Response: {e.response.text[:200]}..."
            print(error_detail_msg) # Log the error for debugging
            raise HTTPException(status_code=502, detail=f"Error communicating with Groq API: {e.response.status_code}. Please try again later.")
        except Exception as e:
            print(f"An unexpected error occurred while calling Groq AI: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An unexpected internal error occurred with the Groq API: {str(e)}")

# 4. Intelligent Handoff Logic
HANDOFF_KEYWORDS = ["human", "agent", "representative", "speak to someone", "live person", "real person", "talk to a human"]
BOT_CANT_HELP_PHRASES = [
    "i'm not sure", "i cannot answer that", "i don't have that information", 
    "i am unable to help with that", "my apologies, i can't assist", "that is beyond my capabilities"
]

def needs_handoff(user_message: str, bot_response: str) -> bool:
    user_message_lower = user_message.lower()
    bot_response_lower = bot_response.lower()
    if any(keyword in user_message_lower for keyword in HANDOFF_KEYWORDS):
        return True
    if any(phrase in bot_response_lower for phrase in BOT_CANT_HELP_PHRASES):
        return True
    return False

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Regular customer chat endpoint - only available to customers"""
    user_id = req.user_id
    user_message = req.message.strip()
    
    # Verify the user role (in a real app, this would check JWT token)
    # For demo, we'll assume the user_id format indicates role
    if user_id.startswith("agent_") or user_id.startswith("admin_"):
        raise HTTPException(
            status_code=403,
            detail="Access denied. This endpoint is only available to customers."
        )
    
    print(f"Received chat request from user {user_id}: '{user_message}'")

    if not user_message:
        return {"response": "Please type a message.", "handoff": False}

    # Initialize chat history for new user or if it was cleared
    if user_id not in chat_histories:
        chat_histories[user_id] = []
        print(f"Initialized new chat history for user {user_id}")

    # Add user message to history
    chat_histories[user_id].append({"role": "user", "content": user_message})
    print(f"Added user message to history. History length: {len(chat_histories[user_id])}")
    
    # Keep history to a manageable size
    if len(chat_histories[user_id]) > MAX_HISTORY_LEN:
        chat_histories[user_id] = chat_histories[user_id][-MAX_HISTORY_LEN:]
        print(f"Trimmed history to {MAX_HISTORY_LEN} messages")

    # 1. Search Knowledge Base
    print("Searching knowledge base...")
    kb_results = search_knowledge_base(user_message)
    print(f"Found {len(kb_results)} relevant items in knowledge base")
    
    kb_context_str = ""
    if kb_results:
        kb_context_str = "Relevant information from our knowledge base:\n"
        for item in kb_results:
            # Present KB items in a more readable format for the LLM
            item_info = f"Type: {item.get('type')}, Name/Title: {item.get('name') or item.get('title') or item.get('question')}, Details: {item.get('description') or item.get('answer') or item.get('content')}"
            kb_context_str += f"- {item_info}\n"
        kb_context_str += "Please use this information if relevant to answer the user's query.\n"

    # 2. Construct prompt for Hugging Face AI
    print("Constructing prompt for Hugging Face AI...")
    system_prompt = (
        "You are CustomerSupportGPT, a friendly and helpful AI assistant for our company powered by Hugging Face. "
        "Your primary goal is to assist users by answering their questions based on the provided knowledge base information and chat history. "
        "If the user's question is not covered by the knowledge base or is too complex, clearly state that you cannot provide the specific information and politely suggest that they might need to speak to a human agent for further assistance. "
        "Do not invent answers or provide information outside of the scope given. Be concise, professional, and empathetic."
    )
    
    messages_for_llm = [{"role": "system", "content": system_prompt}]
    # Add existing chat history
    messages_for_llm.extend(chat_histories[user_id][:-1]) # All but the current user message, which will be added last
    print(f"Added {len(chat_histories[user_id])-1} history messages to prompt")

    # Inject KB context before the latest user message for better relevance
    if kb_context_str:
      messages_for_llm.append({"role": "system", "content": kb_context_str}) # Using 'system' role for KB context can be effective
      print("Added knowledge base context to prompt")
    
    # Add the current user message last
    messages_for_llm.append({"role": "user", "content": user_message}) 
    print("Added current user message to prompt")

    # For simple messages, provide a direct response without calling the AI
    if user_message.lower() in ["hello", "hi", "hey", "greetings"]:
        print("Simple greeting detected, providing direct response")
        greeting_response = "Hello! I'm your virtual assistant. How can I help you today?"
        chat_histories[user_id].append({"role": "assistant", "content": greeting_response})
        return {"response": greeting_response, "handoff": False}

    # 3. Call Hugging Face AI service
    print("Calling Hugging Face AI service...")
    try:
        bot_response_content = await call_ai_service(messages_for_llm)
        print(f"Received response from Hugging Face AI: '{bot_response_content[:50]}...'")
    except HTTPException as e: # Catch HTTPExceptions from AI service calls
        # Log the specific error for internal review
        print(f"Chatbot error for user {user_id}: {e.detail}")
        # Provide a user-friendly error and suggest handoff if appropriate
        return {"response": f"I'm having trouble connecting to the Hugging Face AI service right now. Please try again in a moment, or I can connect you to a human agent.", "handoff": True, "error": True}

    # Add bot response to history
    chat_histories[user_id].append({"role": "assistant", "content": bot_response_content})
    print("Added bot response to chat history")

    # 4. Check for handoff based on bot's response or user's explicit request
    if needs_handoff(user_message, bot_response_content):
        print("Handoff needed based on message content")
        handoff_message = f"I understand this may require further assistance. Let me connect you with a human agent who can help you with that."
        # In a real application, this would trigger a notification to a human agent system
        # with the user_id and chat_histories[user_id]
        print(f"HANDOFF_TRIGGERED: User {user_id}. Last message: '{user_message}'. Bot response: '{bot_response_content}'")
        # Combine bot's attempt with handoff message for a smoother transition
        final_response = f"{bot_response_content}\n\n{handoff_message}"
        return {
            "response": final_response,
            "handoff": True
        }

    print("Returning normal response")
    return {"response": bot_response_content, "handoff": False}
    
# Agent-Assist Chatbot endpoint
@app.post("/api/agent-assist")
async def agent_assist_endpoint(req: AgentAssistRequest):
    """
    Agent-Assist Chatbot endpoint - only available to agents and admins
    Provides:
    1. Relevant information retrieval
    2. Solution suggestions
    3. Response drafting
    4. Ticket summarization
    """
    agent_id = req.agent_id
    conversation_context = req.conversation_context
    query = req.query.strip()
    
    print(f"Received agent-assist request from agent {agent_id}")
    
    # Verify the agent role (in a real app, this would check JWT token)
    # For demo, we'll assume the agent_id format indicates role
    if not agent_id.startswith("agent_") and not agent_id.startswith("admin_"):
        raise HTTPException(
            status_code=403,
            detail="Access denied. This endpoint is only available to agents and admins."
        )
    
    if not query:
        return {"response": "Please provide a query or conversation context to assist with."}
    
    # 1. Search Knowledge Base with the query
    kb_results = search_knowledge_base(query)
    
    # Also search with keywords from the conversation context
    context_kb_results = []
    if conversation_context:
        # Extract key terms from conversation context
        context_terms = set(conversation_context.lower().split())
        # Filter out common words
        common_words = {"the", "and", "is", "in", "to", "a", "of", "for", "with", "on", "at", "from", "by", "about", "as"}
        key_terms = [term for term in context_terms if term not in common_words and len(term) > 3]
        
        # Search KB with each key term
        for term in key_terms[:5]:  # Limit to top 5 terms to avoid too many searches
            term_results = search_knowledge_base(term)
            for item in term_results:
                if item not in context_kb_results and item not in kb_results:
                    context_kb_results.append(item)
    
    # Combine results, prioritizing direct query matches
    all_kb_results = kb_results + context_kb_results
    
    # 2. Prepare knowledge base context for the AI
    kb_context_str = ""
    if all_kb_results:
        kb_context_str = "Relevant information from our knowledge base:\n"
        for item in all_kb_results:
            item_info = f"Type: {item.get('type')}, Name/Title: {item.get('name') or item.get('title') or item.get('question')}, Details: {item.get('description') or item.get('answer') or item.get('content')}"
            kb_context_str += f"- {item_info}\n"
    
    # 3. Construct prompt for AI
    system_prompt = (
        "You are AgentAssistGPT, an AI assistant designed to help customer support agents. "
        "Your goal is to provide relevant information, suggest solutions, draft responses, and summarize tickets based on the conversation context. "
        "Be concise, professional, and focus on actionable insights that will help the agent assist the customer effectively. "
        "Format your response in sections:\n"
        "1. SUMMARY: Brief summary of the customer issue based on the conversation\n"
        "2. SUGGESTED SOLUTIONS: List potential solutions based on knowledge base\n"
        "3. RESPONSE DRAFT: A professional response the agent could use or adapt\n"
        "4. ADDITIONAL RESOURCES: Any other relevant information or internal resources\n"
    )
    
    messages_for_llm = [{"role": "system", "content": system_prompt}]
    
    # Add conversation context if provided
    if conversation_context:
        messages_for_llm.append({
            "role": "system", 
            "content": f"Customer conversation context:\n{conversation_context}"
        })
    
    # Add knowledge base context
    if kb_context_str:
        messages_for_llm.append({
            "role": "system", 
            "content": kb_context_str
        })
    
    # Add the agent's query
    messages_for_llm.append({
        "role": "user", 
        "content": f"Agent query: {query}\nPlease help me assist this customer effectively."
    })
    
    # 4. Call AI service
    try:
        assistant_response = await call_ai_service(messages_for_llm)
        print(f"Generated agent assist response: '{assistant_response[:50]}...'")
        return {"response": assistant_response}
    except HTTPException as e:
        print(f"Agent-assist error for agent {agent_id}: {e.detail}")
        return {
            "response": f"I'm having trouble generating assistance right now. Please try again in a moment.",
            "error": True
        }
        
# Ticket Summarization endpoint
@app.post("/api/ticket-summary")
async def ticket_summary_endpoint(req: TicketSummaryRequest):
    """
    Ticket Summarization endpoint - only available to agents and admins
    Provides a concise summary of a customer conversation/ticket
    """
    agent_id = req.agent_id
    conversation_history = req.conversation_history
    
    print(f"Received ticket summary request from agent {agent_id}")
    
    # Verify the agent role (in a real app, this would check JWT token)
    if not agent_id.startswith("agent_") and not agent_id.startswith("admin_"):
        raise HTTPException(
            status_code=403,
            detail="Access denied. This endpoint is only available to agents and admins."
        )
    
    if not conversation_history:
        return {"summary": "No conversation history provided to summarize."}
    
    # Construct prompt for AI
    system_prompt = (
        "You are TicketSummaryGPT, an AI assistant designed to summarize customer support conversations. "
        "Your task is to analyze the provided conversation history and create a concise, structured summary. "
        "Focus on: 1) The main customer issue, 2) Key details provided, 3) Current status, and 4) Next steps or resolution. "
        "Format your response in a structured way that would be useful for a support ticket system."
    )
    
    messages_for_llm = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Please summarize this customer conversation:\n\n{conversation_history}"}
    ]
    
    # Call AI service
    try:
        summary = await call_ai_service(messages_for_llm)
        print(f"Generated ticket summary: '{summary[:50]}...'")
        return {"summary": summary}
    except HTTPException as e:
        print(f"Ticket summary error for agent {agent_id}: {e.detail}")
        return {
            "summary": "Unable to generate summary at this time. Please try again later.",
            "error": True
        }
        
# Response Drafting endpoint
@app.post("/api/response-draft")
async def response_draft_endpoint(req: ResponseDraftRequest):
    """
    Response Drafting endpoint - only available to agents and admins
    Generates a draft response to a customer query
    """
    agent_id = req.agent_id
    customer_query = req.customer_query
    relevant_info = req.relevant_info
    tone = req.tone
    
    print(f"Received response draft request from agent {agent_id}")
    
    # Verify the agent role (in a real app, this would check JWT token)
    if not agent_id.startswith("agent_") and not agent_id.startswith("admin_"):
        raise HTTPException(
            status_code=403,
            detail="Access denied. This endpoint is only available to agents and admins."
        )
    
    if not customer_query:
        return {"draft": "No customer query provided to draft a response for."}
    
    # Define tone instructions
    tone_instructions = {
        "professional": "Use a formal, professional tone. Be courteous and precise.",
        "friendly": "Use a warm, friendly tone. Be conversational but still professional.",
        "technical": "Use a technical tone with appropriate terminology. Be precise and detailed.",
        "simple": "Use simple language avoiding technical terms. Be clear and straightforward."
    }
    
    # Get tone instruction or default to professional
    selected_tone = tone_instructions.get(tone.lower(), tone_instructions["professional"])
    
    # Construct prompt for AI
    system_prompt = (
        f"You are ResponseDraftGPT, an AI assistant designed to help customer support agents draft responses. "
        f"{selected_tone} "
        f"Your task is to create a well-structured, helpful response to the customer query. "
        f"Include appropriate greetings and closings. Address all aspects of the customer's question."
    )
    
    messages_for_llm = [{"role": "system", "content": system_prompt}]
    
    # Add relevant information if provided
    if relevant_info:
        messages_for_llm.append({
            "role": "system", 
            "content": f"Relevant information to include in your response:\n{relevant_info}"
        })
    
    # Add the customer query
    messages_for_llm.append({
        "role": "user", 
        "content": f"Please draft a response to this customer query:\n\n{customer_query}"
    })
    
    # Call AI service
    try:
        draft_response = await call_ai_service(messages_for_llm)
        print(f"Generated response draft: '{draft_response[:50]}...'")
        return {"draft": draft_response}
    except HTTPException as e:
        print(f"Response draft error for agent {agent_id}: {e.detail}")
        return {
            "draft": "Unable to generate a response draft at this time. Please try again later.",
            "error": True
        }

# --- End Chatbot Specific Code ---

# To run this app (for development):
# 1. Ensure GROQ_API_KEY is in your backend/.env file.
# 2. Run from your terminal: uvicorn backend.main:app --reload
# Example of how to run if this is the main file (for direct testing, not recommended for production structure)
# if __name__ == "__main__":
#     import uvicorn
#     if not GROQ_API_KEY:
#         print("FATAL: GROQ_API_KEY is not set. Please create a backend/.env file with GROQ_API_KEY=your_key")
#     else:
#         print("Starting Uvicorn server...")
#         # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # if file is main.py in current dir
#         uvicorn.run(app, host="0.0.0.0", port=8000) # if app object is passed directly    