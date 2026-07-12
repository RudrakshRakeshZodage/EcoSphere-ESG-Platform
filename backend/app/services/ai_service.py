# EcoSphere ESG Platform - AI Service

import os
from typing import Optional
from openai import AsyncOpenAI

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("WARNING: OPENAI_API_KEY not found in environment variables. AI features will be disabled.")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=api_key)

    async def get_chat_response(self, prompt: str) -> str:
        """Get a text response from the AI."""
        if not self.client:
            return "AI service is currently unavailable: OPENAI_API_KEY is not configured."
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for the EcoSphere ESG Platform. Answer client questions accurately and concisely."},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error getting chat response: {str(e)}"

    async def process_voice_input(self, audio_content: bytes) -> str:
        """Process audio input and return transcribed text."""
        if not self.client:
            return "AI service is currently unavailable: OPENAI_API_KEY is not configured."
        try:
            # OpenAI Whisper API requires a file-like object
            import io
            audio_file = io.BytesIO(audio_content)
            audio_file.name = "input_audio.mp3" # Whisper needs a name with an extension

            transcript = await self.client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
            return transcript.text
        except Exception as e:
            return f"Error processing voice input: {str(e)}"

    async def generate_voice_output(self, text: str) -> bytes:
        """Generate audio output from text."""
        if not self.client:
            return b""
        try:
            response = await self.client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text,
            )
            return await response.read()
        except Exception as e:
            print(f"Error generating voice output: {e}")
            return b""

ai_service = AIService()
