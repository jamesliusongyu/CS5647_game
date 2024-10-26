# src/api/api_handler.py
import base64
import json

from aiohttp import web
from .audio_converter import convert_webm_to_wav
from .model.model_caller import make_grpc_request

# HTTP API handler
async def handle_send_input(request):
    # Simple API response (can be expanded based on your needs)
    return web.Response(text="Hello, World!")


async def get_topic_words(request):
    # return words based on topic in json format
    return web.json_response({"words": ["苹果", "香蕉", "word3"]})

# API function to handle scoring logic (stub implementation)
async def return_topic_words_score(word: str, audio_input: bytes):
    # Comment the next line once the actual implementation of words is added
    word = "我爱吃苹果"
    # Convert the WebM audio input to WAV format (16kHz 16-bit)
    wav = convert_webm_to_wav(audio_input)
    with open('./api/test.wav', 'wb') as wav_file:
        wav_file.write(wav)

    # Make a gRPC request to the model server and get the average score
    response = await make_grpc_request(word, wav)
    print(response)
    
    # Simulate scoring based on the word and audio input (to be replaced with actual logic)
    print(f"Scoring for word '{word}' with audio input of size {len(audio_input)/1024/1024} megabytes")
    #return {"word": word, "score": 100}  # Return a dummy score of 100 for now

    base64_audio = base64.b64encode(wav).decode('utf-8')

    json_data = {
        "match_code": "FW369",
        "game_mode": "normal",
        "username": "junkrat1",
        "overall_score": response,
        "question": word,
        "audio_file": base64_audio,
        "score": response,
        "sample_audio_file": base64_audio,
    }

    return json_data

