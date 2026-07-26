# src/chatbot/model_handler.py
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer
from config import config
import logging
from typing import List, Dict, Any

logging.basicConfig(level=config.LOG_LEVEL)
logger = logging.getLogger(__name__)

class ModelHandler:
    def __init__(self):
        self.device = config.get_device()
        logger.info(f"Using device: {self.device}")
        
        # Initialize models
        self.tokenizer = None
        self.model = None
        self.embedding_model = None
        self.generator_pipeline = None
        
        self.load_models()
    
    def load_models(self):
        """Load AI models."""
        try:
            logger.info("Loading chat model...")
            # tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(config.CHAT_MODEL)
            
            # Load model with appropriate settings for device
            # Use device_map="auto" if GPU is desired; AutoModel will receive that and set hf_device_map
            model_kwargs = {}
            if self.device.type == "cuda":
                model_kwargs['torch_dtype'] = torch.float16
                model_kwargs['device_map'] = "auto"
            else:
                model_kwargs['torch_dtype'] = torch.float32
            
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                config.CHAT_MODEL,
                **{k:v for k,v in model_kwargs.items() if v is not None}
            )
            
            # If device_map wasn't used (no hf_device_map attr) and device is cuda, move model
            if self.device.type == "cuda" and not hasattr(self.model, 'hf_device_map'):
                try:
                    self.model = self.model.to(self.device)
                except Exception as e:
                    logger.warning("Could not .to(device) the model: %s", e)
            
            # Prepare kwargs for pipeline but avoid passing device if model was loaded via accelerate
            pipeline_kwargs = {
                "model": self.model,
                "tokenizer": self.tokenizer,
                "max_length": config.MAX_TOKENS,
                "temperature": config.TEMPERATURE
            }
            
            # Determine whether it's safe to provide device index to pipeline
            # If model has attribute 'hf_device_map', it was loaded via accelerate / device_map and pipeline should NOT get device arg
            device_arg = None
            try:
                if self.device.type == "cuda" and not hasattr(self.model, 'hf_device_map'):
                    # local GPU and model not accelerate-loaded => safe to pass device index (0)
                    device_arg = 0
                else:
                    # either CPU or accelerate-managed device_map => do not pass device
                    device_arg = None
            except Exception:
                device_arg = None
            
            if device_arg is not None:
                pipeline_kwargs['device'] = device_arg
            
            # Create text generation pipeline
            # IMPORTANT: if model was loaded with accelerate (hf_device_map present) we avoided setting 'device'
            self.generator_pipeline = pipeline(
                "text2text-generation",
                **pipeline_kwargs
            )
            
            logger.info("Loading embedding model...")
            # sentence-transformers accepts device as string like "cuda" or "cpu"
            self.embedding_model = SentenceTransformer(
                config.EMBEDDING_MODEL,
                device="cuda" if self.device.type == "cuda" else "cpu"
            )
            
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def generate_response(self, prompt: str, context: str = "") -> str:
        """Generate response using the AI model."""
        try:
            # Prepare input
            if context:
                full_prompt = f"Context: {context}\n\nQuestion: {prompt}\n\nAnswer:"
            else:
                full_prompt = f"Question: {prompt}\n\nAnswer:"
            
            # Generate response
            result = self.generator_pipeline(
                full_prompt,
                max_length=config.MAX_TOKENS,
                num_return_sequences=1,
                do_sample=True,
                temperature=config.TEMPERATURE
            )
            
            # Different pipeline/model types may return different keys
            text_key = None
            if isinstance(result, (list, tuple)) and len(result) > 0:
                # common key names: 'generated_text' or 'text'
                res0 = result[0]
                if 'generated_text' in res0:
                    text_key = 'generated_text'
                elif 'text' in res0:
                    text_key = 'text'
                else:
                    # pick first string-like value
                    for v in res0.values():
                        if isinstance(v, str):
                            text_key = None
                            generated = v
                            break
                    else:
                        generated = ""
                if text_key:
                    generated = res0.get(text_key, "")
            else:
                generated = ""
            
            response = str(generated).strip()
            
            # Clean up response
            response = self.clean_response(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I apologize, but I encountered an error while processing your request."
    
    def clean_response(self, response: str) -> str:
        """Clean up the generated response."""
        # Remove the prompt if it's included in response
        if "Answer:" in response:
            response = response.split("Answer:")[-1].strip()
        
        # Remove any incomplete sentences at the end
        response = response.strip()
        if response and response[-1] not in ['.', '!', '?']:
            # Find last sentence end
            last_period = max(response.rfind('.'), response.rfind('!'), response.rfind('?'))
            if last_period != -1:
                response = response[:last_period + 1]
        
        return response
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for texts."""
        try:
            embeddings = self.embedding_model.encode(
                texts,
                convert_to_tensor=True,
                device=self.device
            )
            
            # Convert to list of lists
            if self.device.type == "cuda":
                embeddings = embeddings.cpu()
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error getting embeddings: {e}")
            return []
    
    def similarity_search(self, query: str, texts: List[str], top_k: int = 3) -> List[Dict]:
        """Find most similar texts to query."""
        try:
            # Get embeddings
            query_embedding = self.embedding_model.encode(
                query,
                convert_to_tensor=True,
                device=self.device
            )
            
            text_embeddings = self.embedding_model.encode(
                texts,
                convert_to_tensor=True,
                device=self.device
            )
            
            # Calculate cosine similarity
            from sentence_transformers.util import cos_sim
            similarities = cos_sim(query_embedding, text_embeddings)[0]
            
            # Get top k results
            top_results = []
            if self.device.type == "cuda":
                similarities = similarities.cpu()
            
            similarity_scores = similarities.tolist()
            
            for _ in range(min(top_k, len(texts))):
                if not similarity_scores:
                    break
                max_idx = similarity_scores.index(max(similarity_scores))
                top_results.append({
                    'text': texts[max_idx],
                    'score': similarity_scores[max_idx]
                })
                similarity_scores[max_idx] = -1  # Mark as used
            
            return top_results
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []
    
    def is_ready(self) -> bool:
        """Check if models are loaded."""
        return all([
            self.tokenizer is not None,
            self.model is not None,
            self.embedding_model is not None,
            self.generator_pipeline is not None
        ])

# Singleton instance
model_handler = ModelHandler()
