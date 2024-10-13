import asyncio
import json
import websockets
import random
import string

# List to keep track of connected clients
clients = []
match_code = None

# Function to generate a random matchmaking code
def generate_match_code(length=6):
    characters = string.ascii_letters + string.digits  # Alphanumeric characters
    return ''.join(random.choice(characters) for _ in range(length))

# WebSocket handler for matchmaking
async def handle_websocket_ping(websocket, path):
    global match_code
    # Add new client to the list
    clients.append(websocket)
    client_id = clients.index(websocket) + 1
    print(f"Client {client_id} connected")

    try:
        if len(clients) == 1:
            # First client connected, generate match code
            match_code = generate_match_code()
            message = json.dumps({"message": "Match code", "code": match_code})
            await websocket.send(message)
            print(f"Generated match code: {match_code}")

        elif len(clients) == 2:
            # Second client connected, validate match code
            await websocket.send(f"Join with match code: {match_code}")
            print("Second client connected. Ready for match.")

            # Start matchmaking server logic
            await start_matchmaking_server()

        else:
            # More than 2 clients trying to connect
            await websocket.send("Match full, try again later.")
            clients.remove(websocket)
            return

        # Keep connection alive, wait for messages
        async for message in websocket:
            print(f"Received message from client {client_id}: {message}")

    except websockets.ConnectionClosed:
        print(f"Client {client_id} disconnected")
    finally:
        # Remove client from the list on disconnection
        if websocket in clients:
            clients.remove(websocket)
            reassign_client_ids()

# Function to start the matchmaking server
async def start_matchmaking_server():
    print("Matchmaking process started")
    # You can place your logic here for starting the game or assigning teams.
    if len(clients) == 2:
        # Notify both clients that the match is starting
        await clients[0].send("Match has started!")
        await clients[1].send("Match has started!")
        print("Both clients have been notified that the match has started.")

# Function to reassign client IDs after a disconnection
def reassign_client_ids():
    for i, client in enumerate(clients):
        print(f"Reassigning client {i + 1}")
