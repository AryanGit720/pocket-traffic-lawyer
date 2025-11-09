# Pocket Traffic Lawyer (India)

An AI-powered web application that answers questions about Indian traffic laws using **Retrieval-Augmented Generation (RAG)**.

---

## 🚀 Features
- 🎯 Specialized in Indian traffic laws (*Motor Vehicles Act 1988, CMVR 1989*)
- 🎤 Voice input (Speech-to-Text)
- 🔊 Voice output (Text-to-Speech)
- 💻 CPU-optimized for local deployment
- 🔒 Privacy-focused with local embeddings and vector storage
- 📱 Mobile-responsive, PWA-style interface

---

## 🛠 Tech Stack
- **Backend**: FastAPI, FAISS, Sentence Transformers  
- **Frontend**: React, TypeScript, Vite, TailwindCSS  
- **Models**: all-MiniLM-L6-v2 (embeddings), Llama3-8B via Groq API / FLAN-T5 (generation)  
- **STT**: faster-whisper  
- **TTS**: pyttsx3  

---

## ⚡ Quick Start

### Using Docker
```bash
docker compose up --build

```
## Manual Setup
See backend/README.md and frontend/README.md for detailed instructions.

## Legal Disclaimer
This application provides informational content about Indian traffic laws and is not a substitute for professional legal advice.


### pocket-traffic-lawyer/.env.example
```env
# API Configuration
GROQ_API_KEY=your_groq_api_key_here
USE_LOCAL_GENERATOR=false
BACKEND_URL=http://localhost:8000

```