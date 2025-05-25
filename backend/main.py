from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import company, user, products, services, policies, faqs, cart # Import all routers
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
app.include_router(company.router, prefix="/companies", tags=["Companies"])
app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(products.router)
app.include_router(services.router)
app.include_router(policies.router)
app.include_router(faqs.router)
app.include_router(cart.router)

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
        # Check in common fields - wrapped in parentheses for clarity and to avoid backslashes
        if (
            query_lower in item.get("question", "").lower() or
            query_lower in item.get("answer", "").lower() or
            query_lower in item.get("name", "").lower() or
            query_lower in item.get("description", "").lower() or
            query_lower in item.get("title", "").lower() or
            query_lower in item.get("content", "").lower()
        ):
            results.append(item)
            continue
        # For products, also check features
        if item.get("type") == "product" and "features" in item:
            if any(query_lower in feature.lower() for feature in item.get("features", [])):
                if item not in results: # Avoid adding duplicates if already matched by common fields
                    results.append(item)
                continue
    return results[:3] # Return top 3 matches 

# 3. Chat History (in-memory, simple implementation for demonstration)
# Key: user_id, Value: list of messages ({"role": "user/assistant", "content": "..."})
chat_histories = {}
MAX_HISTORY_LEN = 10 # Max number of messages (user + assistant) to keep in history for LLM context

class ChatRequest(BaseModel):
    user_id: str
    message: str

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

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    user_id = req.user_id
    user_message = req.message.strip()
    
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