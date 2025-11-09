"""Advanced RAG pipeline with intelligent query processing"""
from typing import Dict, List, Tuple
import logging
import re
from difflib import get_close_matches

from app.core.indexer import IndexManager
from app.core.generator import GeneratorModel
from app.core.rerank import Reranker
from app.config import settings

logger = logging.getLogger(__name__)


class RAGPipeline:
    """Advanced Retrieval-Augmented Generation pipeline with intelligent features"""

    def __init__(
        self,
        index_manager: IndexManager,
        generator: GeneratorModel,
        rerank_enabled: bool = False,
    ):
        self.index_manager = index_manager
        self.generator = generator
        self.rerank_enabled = rerank_enabled

        if rerank_enabled:
            self.reranker = Reranker(settings.MODEL_NAME_RERANK)
        else:
            self.reranker = None
        
        # Common traffic law terms for spell checking
        self.traffic_vocabulary = {
            'helmet', 'seatbelt', 'license', 'licence', 'challan', 'penalty', 'fine',
            'violation', 'traffic', 'vehicle', 'registration', 'insurance', 'permit',
            'drunk', 'driving', 'speeding', 'parking', 'accident', 'collision',
            'overtake', 'signal', 'zebra', 'crossing', 'pedestrian', 'highway',
            'expressway', 'pollution', 'emission', 'certificate', 'rto', 'transport'
        }

    async def process_query(self, query: str) -> Dict:
        """Process a query through the advanced RAG pipeline"""
        
        logger.info(f"Processing query: {query}")
        
        # Step 1: Expand and normalize query
        if settings.ENABLE_QUERY_EXPANSION:
            expanded_query = self._expand_query(query)
            logger.info(f"Expanded query: {expanded_query}")
        else:
            expanded_query = query
        
        # Step 2: Multi-stage retrieval
        retrieved_docs = self._multi_stage_retrieval(expanded_query, query)
        
        # Step 3: Check if we found anything relevant
        if not retrieved_docs:
            return {
                "answer": self._generate_no_results_response(query),
                "sources": [],
                "confidence": 0.0,
            }
        
        # Get confidence from top result
        confidence = retrieved_docs[0][1] if retrieved_docs else 0.0
        
        # Step 4: Check if this is likely a traffic law query
        is_traffic_related, relevance_score = self._is_semantically_relevant(
            retrieved_docs, confidence
        )
        
        if not is_traffic_related:
            return {
                "answer": (
                    "I specialize in Indian traffic laws and regulations. "
                    "Your question doesn't seem to be related to traffic laws, road rules, "
                    "vehicle regulations, or driving in India. "
                    "\n\nI can help you with questions about:\n"
                    "• Traffic fines and penalties\n"
                    "• Driving licenses and permits\n"
                    "• Vehicle registration and documentation\n"
                    "• Traffic violations and rules\n"
                    "• Road safety regulations\n"
                    "• Motor Vehicles Act provisions\n\n"
                    "Please ask a question related to these topics."
                ),
                "sources": [],
                "confidence": 0.0,
            }
        
        # Step 5: Optionally rerank
        if self.rerank_enabled and self.reranker:
            retrieved_docs = self.reranker.rerank(
                query, retrieved_docs, top_k=settings.TOP_K
            )
        else:
            retrieved_docs = retrieved_docs[: settings.TOP_K]
        
        # Step 6: Prepare context and generate answer
        context = self._prepare_context(retrieved_docs)
        prompt = self._create_advanced_prompt(query, context, confidence)
        answer = await self.generator.generate(prompt, max_length=600)
        
        # Step 7: Prepare sources
        sources = self._prepare_sources(retrieved_docs)
        
        logger.info(f"Generated answer with confidence: {confidence:.2f}")
        
        return {
            "answer": answer,
            "sources": sources,
            "confidence": float(confidence),
        }

    def _expand_query(self, query: str) -> str:
        """Expand query to handle variations, misspellings, and synonyms"""
        expanded = query.lower().strip()
        
        # Common misspellings and corrections
        spelling_corrections = {
            r'\btrafic\b': 'traffic',
            r'\bvoilation\b': 'violation',
            r'\bpenality\b': 'penalty',
            r'\blisence\b': 'license',
            r'\blicence\b': 'license',
            r'\bvehical\b': 'vehicle',
            r'\baccidant\b': 'accident',
            r'\bhelmate\b': 'helmet',
            r'\bseatbalt\b': 'seatbelt',
            r'\bseat\s*balt\b': 'seatbelt',
            r'\bchalan\b': 'challan',
            r'\bchalaan\b': 'challan',
            r'\brto\b': 'rto regional transport office',
            r'\bpuc\b': 'puc pollution under control certificate',
            r'\brc\b': 'rc registration certificate',
            r'\bdl\b': 'dl driving license',
        }
        
        for pattern, replacement in spelling_corrections.items():
            expanded = re.sub(pattern, replacement, expanded, flags=re.IGNORECASE)
        
        # Synonym expansion
        synonyms = {
            r'\bfine\b': 'fine penalty charge',
            r'\bpunishment\b': 'punishment penalty fine',
            r'\bhit and run\b': 'hit-and-run hit and run accident leaving accident scene',
            r'\bdrink and drive\b': 'drink and drive drunk driving dui driving under influence',
            r'\bdrunk driving\b': 'drunk driving dui driving under influence drink and drive',
            r'\bover speed\b': 'overspeeding over-speeding speeding speed limit violation',
            r'\bspeed\s*limit\b': 'speed limit speeding maximum speed',
            r'\bjump.*red.*light\b': 'jump red light signal violation run red light',
            r'\bparking\b': 'parking illegal parking no parking zone',
            r'\btriple\s*rid\w*\b': 'triple riding overloading two wheeler pillion',
        }
        
        for pattern, expansion in synonyms.items():
            if re.search(pattern, expanded, flags=re.IGNORECASE):
                expanded = f"{expanded} {expansion}"
        
        # Add common related terms for better retrieval
        traffic_terms_map = {
            'helmet': 'helmet two wheeler motorcycle safety gear section 129',
            'seatbelt': 'seatbelt seat belt safety car section 194b',
            'license': 'license driving license learner permanent dl',
            'insurance': 'insurance third party comprehensive vehicle insurance',
        }
        
        for term, addition in traffic_terms_map.items():
            if term in expanded:
                expanded = f"{expanded} {addition}"
        
        return expanded

    def _multi_stage_retrieval(self, expanded_query: str, original_query: str) -> List[Tuple[Dict, float]]:
        """Multi-stage retrieval strategy for better results"""
        
        # Stage 1: Try with expanded query
        retrieved_docs = self.index_manager.search(expanded_query, top_k=settings.TOP_K * 3)
        
        if retrieved_docs and retrieved_docs[0][1] >= settings.MIN_SEMANTIC_SIMILARITY:
            logger.info(f"Stage 1 retrieval successful with score: {retrieved_docs[0][1]:.3f}")
            return retrieved_docs
        
        # Stage 2: Try with original query if expansion didn't help
        if expanded_query != original_query:
            logger.info("Stage 1 had low confidence, trying original query")
            retrieved_docs_original = self.index_manager.search(original_query, top_k=settings.TOP_K * 3)
            
            # Use whichever gave better results
            if retrieved_docs_original and len(retrieved_docs_original) > 0:
                if not retrieved_docs or retrieved_docs_original[0][1] > retrieved_docs[0][1]:
                    logger.info(f"Stage 2 retrieval better with score: {retrieved_docs_original[0][1]:.3f}")
                    retrieved_docs = retrieved_docs_original
        
        # Stage 3: Try extracting key question words
        if not retrieved_docs or retrieved_docs[0][1] < settings.MIN_SEMANTIC_SIMILARITY:
            logger.info("Trying key-term extraction")
            key_terms = self._extract_key_terms(original_query)
            if key_terms:
                retrieved_docs_keys = self.index_manager.search(key_terms, top_k=settings.TOP_K * 3)
                if retrieved_docs_keys and len(retrieved_docs_keys) > 0:
                    if not retrieved_docs or retrieved_docs_keys[0][1] > retrieved_docs[0][1]:
                        logger.info(f"Stage 3 retrieval successful with score: {retrieved_docs_keys[0][1]:.3f}")
                        retrieved_docs = retrieved_docs_keys
        
        return retrieved_docs if retrieved_docs else []

    def _extract_key_terms(self, query: str) -> str:
        """Extract key terms from query for fallback search"""
        # Remove question words and common words
        stopwords = {
            'what', 'when', 'where', 'which', 'who', 'how', 'is', 'are', 'the',
            'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but',
            'can', 'will', 'would', 'should', 'do', 'does', 'did', 'i', 'my', 'me'
        }
        
        words = query.lower().split()
        key_words = [w for w in words if w not in stopwords and len(w) > 2]
        
        return ' '.join(key_words)

    def _is_semantically_relevant(self, retrieved_docs: List[Tuple[Dict, float]], confidence: float) -> Tuple[bool, float]:
        """Determine if retrieved docs are semantically relevant to traffic laws"""
        
        if not retrieved_docs:
            return False, 0.0
        
        # If confidence is very high, it's likely relevant
        if confidence >= 0.5:
            return True, confidence
        
        # If confidence is very low, likely not relevant
        if confidence < settings.MIN_SEMANTIC_SIMILARITY:
            return False, confidence
        
        # Check if top documents contain traffic law indicators
        top_docs = retrieved_docs[:3]
        traffic_indicators = 0
        
        for doc, score in top_docs:
            text = f"{doc.get('question', '')} {doc.get('answer', '')} {doc.get('category', '')}".lower()
            
            # Check for traffic law terms
            if any(term in text for term in ['motor vehicles act', 'section', 'penalty', 'fine', 'license', 'traffic', 'vehicle', 'road', 'driving']):
                traffic_indicators += 1
        
        # If majority of top docs have traffic indicators, it's relevant
        relevance_ratio = traffic_indicators / len(top_docs)
        is_relevant = relevance_ratio >= 0.5 or confidence >= 0.35
        
        return is_relevant, confidence

    def _prepare_context(self, documents: List[Tuple[Dict, float]]) -> str:
        """Prepare well-structured context from retrieved documents"""
        if not documents:
            return "No relevant information found in the database."
        
        context_parts = []
        
        for i, (doc, score) in enumerate(documents):
            # Format each document clearly
            question = doc.get('question', 'N/A')
            answer = doc.get('answer', 'N/A')
            source = doc.get('source', 'N/A')
            category = doc.get('category', 'General')
            
            context_parts.append(
                f"[Reference {i+1}] (Relevance: {score:.0%}, Category: {category})\n"
                f"Related Question: {question}\n"
                f"Information: {answer}\n"
                f"Legal Source: {source}\n"
            )
        
        return "\n".join(context_parts)

    def _create_advanced_prompt(self, query: str, context: str, confidence: float) -> str:
        """Create an advanced prompt for better answer generation"""
        
        confidence_instruction = ""
        if confidence < 0.4:
            confidence_instruction = "\nNote: The retrieved information has moderate relevance. Use your knowledge of Indian traffic laws to provide the most accurate answer, clearly stating when you're drawing from general legal knowledge versus the specific references."
        
        prompt = f"""Based on the retrieved information and your expertise in Indian traffic laws, answer the user's question comprehensively.

Retrieved Legal References:
{context}

User's Question: {query}
{confidence_instruction}

Instructions for your response:
1. **Directly answer the question** in clear, simple language
2. **Cite specific legal sections** (e.g., "Section 185 of Motor Vehicles Act, 1988") when applicable
3. **Include specific penalties/fines** with rupee amounts (₹) if relevant
4. **Provide practical guidance** in addition to legal information
5. **Use the retrieved references as primary source** but supplement with your knowledge of Indian traffic laws when needed
6. **If information is incomplete**, acknowledge it but provide the best possible answer based on your expertise
7. **Keep the answer well-structured** with clear paragraphs or bullet points for readability
8. **Be conversational yet authoritative** - explain legal terms in simple language

Generate a comprehensive, accurate, and helpful answer:"""
        
        return prompt

    def _generate_no_results_response(self, query: str) -> str:
        """Generate a helpful response when no relevant results are found"""
        return (
            "I couldn't find specific information about your query in my database of Indian traffic laws. "
            "This could mean:\n\n"
            "1. Your question might need to be rephrased for better clarity\n"
            "2. It might be about a very specific or regional regulation\n"
            "3. It could be outside the scope of central traffic laws\n\n"
            "Could you try:\n"
            "• Rephrasing your question with different words?\n"
            "• Being more specific about what aspect of traffic law you're asking about?\n"
            "• Asking about general categories like licenses, fines, vehicle rules, or road safety?\n\n"
            "I'm here to help with questions about Indian traffic laws, Motor Vehicles Act, "
            "driving regulations, fines, penalties, and road safety rules."
        )

    def _prepare_sources(self, documents: List[Tuple[Dict, float]]) -> List[Dict]:
        """Prepare detailed source citations"""
        sources = []
        seen_ids = set()

        for doc, score in documents:
            doc_id = str(doc["id"])
            if doc_id not in seen_ids:
                # Create a more informative snippet
                answer = doc["answer"]
                snippet = answer[:250] + "..." if len(answer) > 250 else answer
                
                sources.append(
                    {
                        "id": doc_id,
                        "source": doc["source"],
                        "snippet": snippet,
                        "score": float(score),
                    }
                )
                seen_ids.add(doc_id)

        return sources