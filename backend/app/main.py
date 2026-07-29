import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import utilities and agents
from app.parser import extract_text_from_file
from app.agent import run_complaint_pipeline

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Powered Customer Complaint Management System",
    description="Backend API services for managing and routing customer complaints",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

@app.get("/")
async def root():
    return {
        "status": "Backend Running"
    }

@app.post("/api/analyze-text")
async def analyze_text(payload: TextPayload):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text narrative cannot be empty.")
    try:
        result = run_complaint_pipeline(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    filename = file.filename
    try:
        content = await file.read()
        extracted_text = extract_text_from_file(content, filename)
        result = run_complaint_pipeline(extracted_text)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
