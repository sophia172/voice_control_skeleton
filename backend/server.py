# backend/server.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes should be defined before static file handling
@app.get("/api/signed-url")
async def get_signed_url():
    agent_id = os.getenv("AGENT_ID")
    xi_api_key = os.getenv("XI_API_KEY")
    
    if not agent_id or not xi_api_key:
        raise HTTPException(status_code=500, detail="Missing environment variables")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={agent_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers={"xi-api-key": xi_api_key}
            )
            response.raise_for_status()
            data = response.json()
            return {"signedUrl": data["signed_url"]}
            
        except httpx.HTTPError:
            raise HTTPException(status_code=500, detail="Failed to get signed URL")


#API route for getting Agent ID, used for public agents
@app.get("/api/getAgentId")
def get_unsigned_url():
    agent_id = os.getenv("AGENT_ID")
    return {"agentId": agent_id}

# New endpoint to process movement commands
@app.post("/api/process-command")
async def process_command(request: Request):
    try:
        data = await request.json()
        command = data.get("command")
        
        if not command:
            return JSONResponse(
                status_code=400,
                content={"error": "Command is required"}
            )
        
        print(f"Received command: {command}")
        
        # For now, we'll just echo back the command
        # In a more advanced implementation, you could use a more sophisticated NLP model
        # or integrate with ElevenLabs' agent capabilities
        
        # Simple command processing logic
        processed_command = {
            "originalCommand": command,
            "timestamp": datetime.now().isoformat(),
            "processed": True
        }
        
        return processed_command
        
    except Exception as e:
        print(f"Error processing command: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to process command"}
        )

# Mount static files for specific assets (CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="dist"), name="static")

# Serve index.html for root path
@app.get("/")
async def serve_root():
    return FileResponse("dist/index.html")