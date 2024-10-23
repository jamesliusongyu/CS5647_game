import asyncio
import base64
import json
import websockets
import random
import string
import time

from aiohttp import web

from api.api_handler import return_topic_words_score
from db.db_handler import DBHandler


class MatchMaking():
    def __init__(self):
        # Dictionary to track rooms and their clients, along with expiration time and client ID
        self.clients = {}
        self.match_code = None
        self.EXPIRATION_TIME = 300  # 5 minutes for match code to expire (in seconds)
        self.persistence = DBHandler()
        self.persistence.ping_server()

    # Function to generate a random matchmaking code
    def generate_match_code(self, length=6):
        characters = string.ascii_letters + string.digits  # Alphanumeric characters
        return ''.join(random.choice(characters) for _ in range(length))

    # Function to generate a random client ID, including the username
    def generate_client_id(self, username):
        random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return f"{random_id}_{username}"

    # WebSocket handler for matchmaking
    async def handle_websocket_ping(self, websocket, path):
        client_id = None  # Initialize client ID as None
        print(f"Websocket(): New connection established")
        match_code = None
        username = None

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
                    print(f"Websocket(): Received audio data from Client ID {client_id}")

                    # Call the return_topic_words_score with the current word and audio input
                    score_response = await return_topic_words_score(word_for_round, audio_input)
                    # Roy: persisted the score_response to the database
                    persisted_data = {
                        "match_code": match_code,
                        "client_id": client_id,
                        "username": username if username else client_id.split('_')[1],
                        "game_mode": "normal",
                        "word": word_for_round,
                        "audio": audio_input,
                        "score": score_response['score'],
                    }
                    self.persistence.insert_data("scores", persisted_data)

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
                    client_id = self.generate_client_id(username)
                    print(f"Websocket(): Assigned Client ID: {client_id}")

                    # Generate match code and set expiration time
                    match_code = self.generate_match_code()
                    expiration_time = time.time() + self.EXPIRATION_TIME
                    self.clients[match_code] = {"connections": [(websocket, client_id)], "expiration": expiration_time}
                    response = {"action": "create", "message": "Match code generated", "code": match_code}
                    await websocket.send(json.dumps(response))
                    print(f"Websocket(): Generated match code {match_code} for Client ID {client_id}")

                # Handle join request (Player B)
                elif data.get("action") == "join" and data.get("code") and data.get("username"):
                    room_code = data["code"]
                    username = data.get("username")
                    client_id = self.generate_client_id(username)  # Generate Client ID for Player B
                    current_time = time.time()
                    if room_code in self.clients:
                        room = self.clients[room_code]
                        # Check if the match code is still valid
                        if room["expiration"] < current_time:
                            # Match code expired
                            response = {"status": "error", "message": "Match code expired"}
                            await websocket.send(json.dumps(response))
                            del self.clients[room_code]
                            print(f"Websocket(): Match code {room_code} expired for Client ID {client_id}")
                        # Check if room is full (already 2 players)
                        elif len(room["connections"]) >= 2:
                            response = {"status": "error", "message": "Room is full"}
                            await websocket.send(json.dumps(response))
                            print(f"Websocket(): Client ID {client_id} tried to join a full room with code {room_code}")
                        else:
                            # Add Player B to the room
                            room["connections"].append((websocket, client_id))
                            response = {"status": "success", "message": "Joined the room"}
                            await websocket.send(json.dumps(response))
                            # Notify Player A that Player B has joined
                            await room["connections"][0][0].send(json.dumps({"status": "success", "message": "Opponent has joined"}))
                            await self.start_matchmaking_server(room_code)
                            print(f"Websocket(): Client ID {client_id} joined room with code {room_code}")
                    else:
                        # Invalid code, reject connection
                        response = {"status": "error", "message": "Invalid access code"}
                        await websocket.send(json.dumps(response))
                        print(f"Websocket(): Client ID {client_id} entered an invalid code {room_code}")


        except websockets.ConnectionClosed:
            print(f"Websocket(): Client ID {client_id} disconnected")
        finally:
            # Clean up: Remove client on disconnect if part of a room
            to_remove_room_codes = []
            for room_code, room in self.clients.items():
                for connection, conn_id in room["connections"]:
                    if websocket == connection:
                        room["connections"].remove((connection, conn_id))
                        if len(room["connections"]) == 0:
                            to_remove_room_codes.append(room_code)
                        print(f"Websocket(): Client ID {client_id} disconnected from room {room_code}")
                        break
            for room_code in to_remove_room_codes:
                del self.clients[room_code]

    # Function to start the matchmaking server
    async def start_matchmaking_server(self,room_code):
        print(f"Websocket(): Matchmaking process started for room {room_code}")
        # Notify both clients that the match is starting
        if len(self.clients[room_code]["connections"]) == 2:
            client1_id = self.clients[room_code]["connections"][0][1]
            client2_id = self.clients[room_code]["connections"][1][1]
            await self.clients[room_code]["connections"][0][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id,"message": "Match has started!"}))
            await self.clients[room_code]["connections"][1][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id, "message": "Match has started!"}))
            print(f"Websocket(): Both clients in room {room_code} (Client IDs {client1_id} and {client2_id}) have been notified that the match has started.")

    async def get_results(self, request):
        """
        :param request: contains "match_code" as a query parameter
        :return: {
        "match_code": xxx,
        "word 1":{
            "sample_audio": xxx,
            "user_result":{
                "username1": {
                    "audio": xxx,
                    "score": xxx
                },
                "username2": {
                    "audio": xxx,
                    "score": xxx
                }
            }
        },
        }
        """
        match_code = request.query.get("match_code")
        if not match_code:
            return web.json_response({"error": "Match code not provided"}, status=400)
        result = {"match_code": match_code}
        # Get the results from the database
        data = self.persistence.load_data("scores", {"match_code": match_code})
        if not data:
            return web.json_response({"error": "No results found for the match code"}, status=404)
        for datum in data:
            word = datum['word']
            if word in result:
                result[word]["user_result"][datum["username"]] = {"audio": base64.b64encode(datum["audio"]).decode('utf-8'), "score": datum["score"]}
            else:
                result[word] = {"user_result":{}}
                result[word]["user_result"][datum["username"]] = {"audio": base64.b64encode(datum["audio"]).decode('utf-8'), "score": datum["score"]}

        # get sample audio
        data = self.persistence.load_data("samples", {"word": {"$in": ["word1", "word2", "word3"]}})
        for datum in data:
            result[datum["word"]]["sample_audio"] = base64.b64encode(datum["audio"]).decode('utf-8')


        return web.json_response(result)
