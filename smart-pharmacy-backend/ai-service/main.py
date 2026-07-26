from fastapi import FastAPI
from pydantic import BaseModel
from src.chatbot.chat_engine import chat_engine

app = FastAPI(title="Smart Pharmacy AI Service")

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    response = chat_engine.respond(req.message)
    return {
        "success": True,
        "response": response
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "data_loaded": True
    }
