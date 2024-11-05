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
        self.topic = None
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
        topic = None

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
                    # persisted the score_response to the database

                    if data.get("gameMode") == "Normal 1v1":
                        persisted_data = {
                            "match_code": self.match_code,
                            "client_id": client_id,
                            "username": username if username else client_id.split('_')[1],
                            "game_mode": "normal",
                            "word": word_for_round,
                            "audio": audio_input,
                            "score": score_response['score'],
                        }
                    else:
                        persisted_data = {
                            "match_code": self.match_code,
                            "client_id": client_id,
                            "username": username if username else client_id.split('_')[1],
                            "game_mode": "dialogue",
                            "order" : data.get("order"),
                            "playerRole" : data.get("playerRole"),
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
                if data.get("action") == "create" and data.get("username") and data.get("topic"):
                    # Generate client ID using the username
                    username = data.get("username")
                    client_id = self.generate_client_id(username)
                    print(f"Websocket(): Assigned Client ID: {client_id}")

                    # adds topic
                    self.topic = data.get("topic")
                    print (self.topic, "topic")
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
                    # match_code = room_code
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
                            response = {"status": "success", "topic":self.topic, "message": "Joined the room"}
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
    
            pass

    # Function to start the matchmaking server
    async def start_matchmaking_server(self,room_code):
        print(f"Websocket(): Matchmaking process started for room {room_code}")
        # Notify both clients that the match is starting
        if len(self.clients[room_code]["connections"]) == 2:
            client1_id = self.clients[room_code]["connections"][0][1]
            client2_id = self.clients[room_code]["connections"][1][1]
            await self.clients[room_code]["connections"][0][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id,"message": "Match has started!"}))
            await self.clients[room_code]["connections"][1][0].send(json.dumps({"action": "start", "username1": client1_id, "username2": client2_id, "message": "Match has started!"}))
            self.match_code = room_code
            print(f"Websocket(): Both clients in room {room_code} (Client IDs {client1_id} and {client2_id}) have been notified that the match has started.")



    async def get_results(self, request):
        """
        :param request: contains "match_code" as a query parameter
        :return: [
            {
                "word": "word1",
                "sample": "sample_audio",
                "player1": {
                    "username": "username1",
                    "audio": "base64_audio_1",
                    "score1": score1,
                },
                "player2": {
                    "username": "username2",
                    "audio": "base64_audio_2",
                    "score1": score1,
                }
            },
            ...
        ]
        """
        # match_code = self.match_code
        match_code = 'dyMBAd'

        if not match_code:
            return web.json_response({"error": "Match code not provided"}, status=400)

        result = []
        # Get the results from the database based on match_code
        data = self.persistence.load_data("scores", {"match_code": match_code})
        if not data:
            return web.json_response({"error": "No results found for the match code"}, status=404)

        # Get sample audios for the words used in this match
        samples_data = self.persistence.load_data("samples", {"word": {"$in": [datum['word']['text'] for datum in data]}})
        print (samples_data, "samples_data")
        sample_map = {datum["word"]: base64.b64encode(datum["audio"]).decode('utf-8') for datum in samples_data}

        # Process data for each word and both players
        word_results = {}
        for datum in data:
            print(datum['word'], "datum")
            
            # Extract word details
            word_text = datum['word']['text']
            pinyin = datum['word']['pinyin']
            username = datum['username']

            # Check if the word_text is already in word_results
            if word_text not in word_results:
                word_results[word_text] = {
                    "word": word_text,
                    "pinyin": pinyin,  # Add pinyin to the result
                    "sample": sample_map.get(word_text, ""),  # Attach the sample audio for the word
                    "player1": None,
                    "player2": None
                }

            # Prepare player data
            player_data = {
                "username": username,
                "audio": base64.b64encode(datum["audio"]).decode('utf-8'),
                "score1": datum.get("score"),
            }

            # Assign data to player1 or player2 based on first availability
            if word_results[word_text]["player1"] is None:
                word_results[word_text]["player1"] = player_data
            else:
                word_results[word_text]["player2"] = player_data

        # Collect all word results into the final result list
        result = list(word_results.values())
        # Check if there are 3 words and both players' data for the last word is available
        if len(result) == 3 and result[-1]["player1"] is not None and result[-1]["player2"] is not None:
            # When result is complete for both players, send to all clients via WebSocket
            clients_in_room = self.clients.get(match_code, {}).get("connections", [])
            print(clients_in_room, "clients_in_room")
            # Send the result data to both clients in the room
            for websocket, client_id in clients_in_room:
                await websocket.send(json.dumps({
                    "action": "results",
                    "match_code": match_code,
                    "results": result
                }))
            print(f"Results sent to both players for match_code {match_code}")

        return web.json_response(result)


    async def get_dialogue_results(self, request):
        """
        :param request: contains "match_code" as a query parameter
        :return: [
            {
                "player1": {
                    "username": "username1",
                    "audio": "base64_audio_1",
                    "score1": score1,
                    "word": "word1",
                    "sample": "sample_audio",
                    "pinyin": "asd",
                    "order": 1,
                    "playerRole": "question"
                },
                "player2": {
                    "username": "username2",
                    "audio": "base64_audio_2",
                    "score1": score1,
                    "word": "word1",
                    "sample": "sample_audio",
                    "pinyin": "asd",
                    "order": 1,
                    "playerRole": "answer"
                }
            },
            ...
        ]
        """
        # match_code = self.match_code or request.query.get("match_code")
        match_code = 'a8OWea'  # Hardcoded for example; remove in production

        if not match_code:
            return web.json_response({"error": "Match code not provided"}, status=400)

        # Retrieve data for the match_code
        data = self.persistence.load_data("scores", {"match_code": match_code})
        if not data:
            return web.json_response({"error": "No results found for the match code"}, status=404)

        # Retrieve sample audios for the words used in this match
        filter_words = [datum['word']['text'][2:] if datum['word']['text'][1] == ':' else datum['word']['text'] for datum in data]
        samples_data = self.persistence.load_data("samples", {"word": {"$in": filter_words}})
        # samples_data = self.persistence.load_data("samples", {"word": {"$in": [datum['word']['text'] for datum in data]}})
        # print (len(samples_data))
        sample_map = {datum["word"].strip(): base64.b64encode(datum["audio"]).decode('utf-8') for datum in samples_data}
        # print (len(sample_map))
        word_results = {}
        for datum in data:
            # Extract details
            word_text = datum['word']['text']

            #remove the A: or B:
            if word_text[1] == ":":
                word_text_clean = word_text[2:].strip()  
            print (word_text)
            print (word_text_clean)

            pinyin = datum['word']['pinyin']
            username = datum['username']
            order = datum['order']
            player_role = datum['playerRole']

            # Initialize word entry if not already present
            if order not in word_results:
                # print("Sample map keys:", list(sample_map.keys()))
                # print (sample_map.get(""+word_text_clean, ""), "asd")
                word_results[order] = {
                    "word": word_text,
                    "pinyin": pinyin,
                    "sample": sample_map.get(word_text_clean, ""),
                    "player1": None,
                    "player2": None,
                    "order": order
                }

            # Prepare player data
            player_data = {
                "username": username,
                "audio": base64.b64encode(datum["audio"]).decode('utf-8'),
                "score1": datum.get("score"),
                "word": word_text,
                "sample": sample_map.get(word_text_clean, ""),
                "pinyin": pinyin,
                "order": order,
                "playerRole": player_role
            }

            # Assign data to player1 or player2 based on availability and role
            if word_results[order]["player1"] is None and player_role == "question":
                word_results[ order]["player1"] = player_data
            elif word_results[ order]["player2"] is None and player_role == "answer":
                word_results[ order]["player2"] = player_data

        # Format the final result as required
        result = [{"player1": value["player1"], "player2": value["player2"]} for value in word_results.values()]

        # Send results to both clients if complete
        if result[-1]["player1"] and result[-1]["player2"]:
            clients_in_room = self.clients.get(match_code, {}).get("connections", [])
            for websocket, client_id in clients_in_room:
                await websocket.send(json.dumps({
                    "action": "results",
                    "match_code": match_code,
                    "results": result
                }))
            print(f"Results sent to both players for match_code {match_code}")

        return web.json_response(result)