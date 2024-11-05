from gtts import gTTS
import base64
import pymongo
from bson import Binary  # Correct import for Binary type
from io import BytesIO
from dotenv import load_dotenv
import os

from api import vocab

# Load environment variables from .env file
load_dotenv()

# Access MongoDB URI and Database name from .env
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

# MongoDB client setup
client = pymongo.MongoClient(MONGODB_URI)
db = client[DB_NAME]
collection = db["samples"]

def text_to_speech_binary(text, language="zh"):
    # Generate audio with gTTS
    tts = gTTS(text=text, lang=language)
    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)  # Write audio to in-memory file
    
    # Convert audio to binary data
    audio_buffer.seek(0)
    audio_binary = audio_buffer.read()  # Directly use binary data
    return audio_binary

def save_audio_to_mongodb(text, language="zh"):
    # Get the binary audio
    audio_binary = text_to_speech_binary(text, language)
    
    # Prepare the document to insert
    audio_doc = {
        "word": text,
        "audio": Binary(audio_binary)  # Store as binary data
    }
    
    # Insert into MongoDB
    collection.insert_one(audio_doc)
    print("Audio saved to MongoDB successfully.")

# Example usage
# text = "A: 听起来很好！你觉得这个行业的挑战是什么？"  # "Hello World" in Chinese

# normal_vocab = vocab.NORMAL_VOCAB 

# for category in normal_vocab:
#     for text in normal_vocab[category]:
#         print (text['text'])
#         save_audio_to_mongodb(text['text'])


dialog_vocab = vocab.DIALOG_VOCAB 

for category in dialog_vocab:
    for text in dialog_vocab[category]:
        for text2 in text:
             # Strip the first character and colon if present
            chinese_text = text2['text'][2:] if text2['text'][1] == ':' else text2['text']
            print(chinese_text)
            save_audio_to_mongodb(chinese_text)



# save_audio_to_mongodb(text)