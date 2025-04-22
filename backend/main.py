from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn
import os
import uuid
from pathlib import Path
from TTS.api import TTS
import json
import shutil
import logging
from typing import List, Dict
import aiofiles
import asyncio
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fires-e3b6a.web.app", "http://localhost:3000", "http://127.0.0.1:3000", "http://10.0.0.42:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"]
)

# Create directories for storing files
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
MODELS_DIR = Path("models")
STATUS_DIR = Path("status")

for dir_path in [UPLOAD_DIR, OUTPUT_DIR, MODELS_DIR, STATUS_DIR]:
    dir_path.mkdir(exist_ok=True)

class TextInput(BaseModel):
    text: str

class JobStatus(BaseModel):
    status: str
    progress: float
    message: str | None = None
    created_at: str
    updated_at: str

async def save_job_status(job_id: str, status: str, progress: float, message: str | None = None):
    try:
        status_file = STATUS_DIR / f"{job_id}.json"
        now = datetime.now().isoformat()
        
        # Create new status or update existing
        if status_file.exists():
            async with aiofiles.open(status_file, 'r') as f:
                content = await f.read()
                current_status = json.loads(content)
                current_status.update({
                    "status": status,
                    "progress": progress,
                    "message": message,
                    "updated_at": now
                })
        else:
            current_status = {
                "status": status,
                "progress": progress,
                "message": message,
                "created_at": now,
                "updated_at": now
            }
        
        # Save to file
        async with aiofiles.open(status_file, 'w') as f:
            await f.write(json.dumps(current_status))
            
        logger.info(f"Saved status for job {job_id}: {status}")
    except Exception as e:
        logger.error(f"Error saving job status: {str(e)}")
        raise e

async def load_job_status(job_id: str) -> Dict:
    try:
        status_file = STATUS_DIR / f"{job_id}.json"
        if not status_file.exists():
            raise FileNotFoundError(f"No status file found for job {job_id}")
            
        async with aiofiles.open(status_file, 'r') as f:
            content = await f.read()
            return json.loads(content)
    except Exception as e:
        logger.error(f"Error loading job status: {str(e)}")
        raise e

@app.post("/api/upload-samples")
async def upload_samples(files: List[UploadFile]):
    try:
        logger.info(f"Received upload request with {len(files)} files")
        
        # Create a unique directory for this set of samples
        session_id = str(uuid.uuid4())
        session_dir = UPLOAD_DIR / session_id
        session_dir.mkdir(exist_ok=True)
        
        logger.info(f"Created session directory: {session_dir}")

        # Save all uploaded files
        saved_files = []
        for i, file in enumerate(files):
            try:
                logger.info(f"Processing file {i + 1}/{len(files)}: {file.filename}")
                
                if not file.filename:
                    logger.warning(f"File {i + 1} has no filename")
                    continue
                
                # Ensure filename is safe
                safe_filename = Path(file.filename).name
                file_path = session_dir / safe_filename
                
                # Read file content
                content = await file.read()
                logger.info(f"Read {len(content)} bytes from file {safe_filename}")
                
                # Write content to file
                async with aiofiles.open(file_path, "wb") as f:
                    await f.write(content)
                logger.info(f"Saved file to {file_path}")
                
                saved_files.append(str(file_path))
            except Exception as e:
                logger.error(f"Error processing file {file.filename}: {str(e)}")
                return JSONResponse(
                    status_code=500,
                    content={"error": f"Error processing file {file.filename}: {str(e)}"}
                )

        if not saved_files:
            logger.error("No files were successfully saved")
            return JSONResponse(
                status_code=400,
                content={"error": "No files were successfully saved"}
            )

        logger.info(f"Successfully saved {len(saved_files)} files")
        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "message": f"Successfully uploaded {len(saved_files)} files",
                "saved_files": saved_files
            }
        )
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Upload error: {str(e)}"}
        )

async def process_voice_clone(job_id: str, session_id: str, text: str):
    try:
        logger.info(f"Starting voice cloning for job {job_id}")
        await save_job_status(job_id, "training", 0, "Initializing TTS model...")

        # Initialize TTS with the YourTTS model
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts", 
                  progress_bar=False, gpu=False)  # Set gpu=False for CPU usage

        # Get the path to the voice samples
        session_dir = UPLOAD_DIR / session_id
        sample_files = list(session_dir.glob("*.wav"))
        
        if not sample_files:
            logger.error(f"No voice samples found in {session_dir}")
            raise Exception("No voice samples found")

        logger.info(f"Found {len(sample_files)} voice samples")
        reference_file = str(sample_files[0])
        logger.info(f"Using reference file: {reference_file}")

        # Update status
        await save_job_status(job_id, "generating", 30, "Generating speech...")

        # Generate speech using the first sample for speaker reference
        output_path = OUTPUT_DIR / f"{job_id}.wav"
        logger.info(f"Generating speech to {output_path}")
        
        tts.tts_to_file(
            text=text,
            speaker_wav=reference_file,
            language="en",
            file_path=str(output_path)
        )

        if not output_path.exists():
            logger.error(f"Failed to generate audio file at {output_path}")
            raise Exception("Failed to generate audio file")

        # Verify file size
        file_size = output_path.stat().st_size
        if file_size == 0:
            logger.error(f"Generated audio file is empty: {output_path}")
            raise Exception("Generated audio file is empty")

        logger.info(f"Successfully generated audio file at {output_path} ({file_size} bytes)")
        await save_job_status(job_id, "completed", 100, "Voice generation complete!")

    except Exception as e:
        logger.error(f"Error in voice cloning: {str(e)}")
        await save_job_status(job_id, "error", 0, str(e))
        raise e

@app.post("/api/generate-speech/{session_id}")
async def generate_speech(session_id: str, text_input: TextInput, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Received speech generation request for session {session_id}")
        job_id = str(uuid.uuid4())
        
        # Validate session exists
        session_dir = UPLOAD_DIR / session_id
        if not session_dir.exists():
            logger.error(f"Session directory not found: {session_dir}")
            raise HTTPException(status_code=404, detail="Session not found")

        # Validate text input
        if not text_input.text.strip():
            logger.error("Empty text input")
            raise HTTPException(status_code=400, detail="Text input cannot be empty")

        logger.info(f"Created job {job_id} for text: {text_input.text[:50]}...")
        await save_job_status(job_id, "queued", 0, "Job queued")
        
        # Start processing in the background
        background_tasks.add_task(process_voice_clone, job_id, session_id, text_input.text)
        
        return {"job_id": job_id}
    except Exception as e:
        logger.error(f"Error in generate_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    try:
        status = await load_job_status(job_id)
        return status
    except FileNotFoundError:
        logger.error(f"Job not found: {job_id}")
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        logger.error(f"Error in get_status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/{job_id}")
async def get_audio(job_id: str):
    try:
        file_path = OUTPUT_DIR / f"{job_id}.wav"
        if not file_path.exists():
            logger.error(f"Audio file not found: {file_path}")
            raise HTTPException(status_code=404, detail="Audio file not found")
            
        # Check file size
        file_size = file_path.stat().st_size
        if file_size == 0:
            logger.error(f"Audio file is empty: {file_path}")
            raise HTTPException(status_code=500, detail="Audio file is empty")

        logger.info(f"Serving audio file: {file_path} ({file_size} bytes)")
        
        # Use FileResponse with explicit headers
        return FileResponse(
            str(file_path),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'attachment; filename="generated_speech_{job_id}.wav"',
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes"
            }
        )
    except Exception as e:
        logger.error(f"Error in get_audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
