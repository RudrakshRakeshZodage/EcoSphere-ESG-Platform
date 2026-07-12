from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from app.services.ai_service import ai_service
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response_text = await ai_service.get_chat_response(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice-chat")
async def voice_chat(file: UploadFile = File(...)):
    try:
        audio_data = await file.read()
        transcription = await ai_service.process_voice_input(audio_data)
        response_text = await ai_service.get_chat_response(transcription)
        
        # Generate audio for the response
        audio_response = await ai_service.generate_voice_output(response_text)
        
        return {
            "transcription": transcription,
            "response": response_text,
            "audio_available": len(audio_response) > 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text-to-speech")
async def text_to_speech(request: ChatRequest):
    try:
        audio_data = await ai_service.generate_voice_output(request.message)
        if not audio_data:
             raise HTTPException(status_code=500, detail="Failed to generate audio")
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
