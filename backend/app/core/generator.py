"""Text generation models with improved prompting"""
import logging
from typing import Optional
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
from groq import Groq
import asyncio

logger = logging.getLogger(__name__)

class GeneratorModel:
    """Wrapper for text generation models with advanced capabilities"""
    
    def __init__(self, model_name: str, use_local: bool = False, api_key: Optional[str] = None):
        self.model_name = model_name
        self.use_local = use_local
        self.api_key = api_key
        
        if use_local:
            logger.info(f"Loading local model: {model_name}")
            self._init_local_model()
        else:
            if not api_key:
                logger.warning("No API key provided, will use local model as fallback")
                self.use_local = True
                self._init_local_model()
            else:
                logger.info("Using Groq API for generation")
                self.client = Groq(api_key=api_key)
    
    def _init_local_model(self):
        """Initialize local model"""
        self.tokenizer = T5Tokenizer.from_pretrained(self.model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(
            self.model_name,
            torch_dtype=torch.float32
        )
        # Move to CPU explicitly
        self.model = self.model.to('cpu')
        self.model.eval()
        logger.info("Local model loaded successfully on CPU")
    
    async def generate(self, prompt: str, max_length: int = 512) -> str:
        """Generate text from prompt"""
        if self.use_local:
            return self._generate_local(prompt, max_length)
        else:
            return await self._generate_api(prompt, max_length)
    
    def _generate_local(self, prompt: str, max_length: int) -> str:
        """Generate using local model"""
        # Prepare input
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=512,
            truncation=True
        )
        
        # Move inputs to CPU
        inputs = {k: v.to('cpu') for k, v in inputs.items()}
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=4,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                early_stopping=True
            )
        
        # Decode
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
    
    async def _generate_api(self, prompt: str, max_length: int) -> str:
        """Generate using Groq API with current available model"""
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": """You are an expert legal advisor specializing in Indian traffic laws and the Motor Vehicles Act, 1988.

Your expertise includes:
- Motor Vehicles Act, 1988 and all amendments
- Central Motor Vehicle Rules (CMVR), 1989
- State-specific traffic regulations
- Penalties, fines, and legal procedures
- Licensing requirements and procedures
- Vehicle registration and documentation
- Traffic violations and their consequences

FORMATTING GUIDELINES:
1. Write in clear, flowing paragraphs - avoid excessive headings
2. Use bold (**text**) ONLY for:
   - Key penalty amounts (e.g., **₹1,000**)
   - Section references (e.g., **Section 194B**)
   - Critical legal terms
3. DO NOT use bold for general headings like "Legal Consequences:" or "Practical Guidance:"
4. Structure your answer in 2-3 concise paragraphs maximum
5. Use natural language, not a list of sections

CONTENT GUIDELINES:
1. Provide accurate, authoritative answers based on Indian traffic laws
2. Use the retrieved context as primary reference but supplement with your knowledge
3. Always cite specific sections (e.g., "under Section 194B of the Motor Vehicles Act, 1988")
4. Use rupee symbol (₹) for monetary amounts
5. Keep answers concise and well-structured
6. If uncertain about specific details, acknowledge it clearly

Your answer should read like a knowledgeable lawyer explaining to a client, not a formatted document."""
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.2,
                    max_tokens=max_length,
                    top_p=0.85,
                    frequency_penalty=0.1,
                    presence_penalty=0.1
                )
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"API generation failed: {e}, falling back to local model")
            if not hasattr(self, 'model'):
                self._init_local_model()
            self.use_local = True
            return self._generate_local(prompt, max_length)