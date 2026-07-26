import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 8000))
    API_WORKERS = int(os.getenv("API_WORKERS", 4))
    
    # Database Configuration
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "pharmacy_db")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    
    # AI Model Configuration
    CHAT_MODEL = os.getenv("CHAT_MODEL", "google/flan-t5-base")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    USE_GPU = os.getenv("USE_GPU", "True").lower() == "true"
    
    # Chatbot Configuration
    MAX_CONTEXT_LENGTH = 512
    TEMPERATURE = 0.7
    MAX_TOKENS = 256
    
    # Vector Database
    VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./chroma_db")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Telegram (for alerts)
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    
    @classmethod
    def get_database_url(cls):
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def get_device(cls):
        import torch
        if cls.USE_GPU and torch.cuda.is_available():
            return torch.device("cuda")
        else:
            return torch.device("cpu")
# Add to Config class
    @classmethod
    def get_torch_dtype(cls):
        import torch
        if cls.USE_GPU and torch.cuda.is_available():
            return torch.float16  # Use half precision for faster inference
        else:
            return torch.float32

    @classmethod
    def get_model_kwargs(cls):
        kwargs = {}
        if cls.USE_GPU and torch.cuda.is_available():
            kwargs['device_map'] = "auto"
            kwargs['torch_dtype'] = cls.get_torch_dtype()
        return kwargs
config = Config()