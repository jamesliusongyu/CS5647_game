# src/http/api_handler.py
from aiohttp import web

# HTTP API handler
async def handle_send_input(request):
    # Simple API response (can be expanded based on your needs)
    return web.Response(text="Hello, World!")


async def get_topic_words(request):
    # return words based on topic in json format
    return web.json_response({"words": ["word1", "word2", "word3"]})

# API function to handle scoring logic (stub implementation)
async def return_topic_words_score(word: str, audio_input: bytes):
    # Simulate scoring based on the word and audio input (to be replaced with actual logic)
    print(f"Scoring for word '{word}' with audio input of size {len(audio_input)/1024/1024} megabytes")
    return {"word": word, "score": 100}  # Return a dummy score of 100 for now