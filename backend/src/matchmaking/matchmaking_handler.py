import asyncio
import base64
import json
import websockets
import random
import string
import time
from api.api_handler import return_topic_words_score


# Dictionary to track rooms and their clients, along with expiration time and client ID
clients = {}
match_code = None
EXPIRATION_TIME = 300  # 5 minutes for match code to expire (in seconds)

# Function to generate a random matchmaking code
def generate_match_code(length=6):
    characters = string.ascii_letters + string.digits  # Alphanumeric characters
    return ''.join(random.choice(characters) for _ in range(length))

# Function to generate a random client ID, including the username
def generate_client_id(username):
    random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{random_id}_{username}"

# WebSocket handler for matchmaking
async def handle_websocket_ping(websocket, path):
    global match_code
    client_id = None  # Initialize client ID as None
    print(f"New connection established")

    try:
        # Keep connection alive, wait for messages
        async for message in websocket:
            data = json.loads(message)

            if data.get("action") == "audio_input" and data.get("word") and data.get("audio"):
                word_for_round = data["word"]
                audio_base64 = data["audio"]  # This is the base64-encoded audio string
                
                # Decode the base64 audio string
                audio_input = base64.b64decode(audio_base64)
                # If binary data (audio) is received, handle the audio input
                print(f"Received audio data from Client ID {client_id}")
                
                # Call the return_topic_words_score with the current word and audio input
                score_response = await return_topic_words_score(word_for_round, audio_input)
                # Send the score back to the client
                await websocket.send(json.dumps({
                    "action": "score",
                    "word": word_for_round,
                    "score": score_response['score'],
                }))


            # Handle room creation request (Player A)
            if data.get("action") == "create" and data.get("username"):
                # Generate client ID using the username
                username = data.get("username")
                client_id = generate_client_id(username)
                print(f"Assigned Client ID: {client_id}")

                # Generate match code and set expiration time
                match_code = generate_match_code()
                expiration_time = time.time() + EXPIRATION_TIME
                clients[match_code] = {"connections": [(websocket, client_id)], "expiration": expiration_time}
                response = {"action": "create", "message": "Match code generated", "code": match_code}
                await websocket.send(json.dumps(response))
                print(f"Generated match code {match_code} for Client ID {client_id}")

            # Handle join request (Player B)
            elif data.get("action") == "join" and data.get("code") and data.get("username"):
                room_code = data["code"]
                username = data.get("username")
                client_id = generate_client_id(username)  # Generate Client ID for Player B
                current_time = time.time()
                if room_code in clients:
                    room = clients[room_code]
                    # Check if the match code is still valid
                    if room["expiration"] < current_time:
                        # Match code expired
                        response = {"status": "error", "message": "Match code expired"}
                        await websocket.send(json.dumps(response))
                        del clients[room_code]
                        print(f"Match code {room_code} expired for Client ID {client_id}")
                    # Check if room is full (already 2 players)
                    elif len(room["connections"]) >= 2:
                        response = {"status": "error", "message": "Room is full"}
                        await websocket.send(json.dumps(response))
                        print(f"Client ID {client_id} tried to join a full room with code {room_code}")
                    else:
                        # Add Player B to the room
                        room["connections"].append((websocket, client_id))
                        response = {"status": "success", "message": "Joined the room"}
                        await websocket.send(json.dumps(response))
                        # Notify Player A that Player B has joined
                        await room["connections"][0][0].send(json.dumps({"status": "success", "message": "Opponent has joined"}))
                        await start_matchmaking_server(room_code)
                        print(f"Client ID {client_id} joined room with code {room_code}")
                else:
                    # Invalid code, reject connection
                    response = {"status": "error", "message": "Invalid access code"}
                    await websocket.send(json.dumps(response))
                    print(f"Client ID {client_id} entered an invalid code {room_code}")


    except websockets.ConnectionClosed:
        print(f"Client ID {client_id} disconnected")
    finally:
        # Clean up: Remove client on disconnect if part of a room
        for room_code, room in list(clients.items()):
            for connection, conn_id in room["connections"]:
                if websocket == connection:
                    room["connections"].remove((connection, conn_id))
                    if len(room["connections"]) == 0:
                        del clients[room_code]
                    print(f"Client ID {client_id} disconnected from room {room_code}")
                    break

# Function to start the matchmaking server
async def start_matchmaking_server(room_code):
    print(f"Matchmaking process started for room {room_code}")
    # Notify both clients that the match is starting
    if len(clients[room_code]["connections"]) == 2:
        client1_id = clients[room_code]["connections"][0][1]
        client2_id = clients[room_code]["connections"][1][1]
        await clients[room_code]["connections"][0][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id,"message": "Match has started!"}))
        await clients[room_code]["connections"][1][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id, "message": "Match has started!"}))
        print(f"Both clients in room {room_code} (Client IDs {client1_id} and {client2_id}) have been notified that the match has started.")
