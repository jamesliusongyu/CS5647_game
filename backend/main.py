import asyncio
from aiohttp import web
import websockets
import aiohttp_cors

# List to keep track of connected clients
clients = []

# WebSocket handler
async def ping(websocket, path):
    # Add the new client to the list
    clients.append(websocket)
    print(f"Client {clients.index(websocket) + 1} connected")
    print(clients, "clients")
    
    try:
        while True:
            # Dynamically calculate client_id based on the current list of clients
            client_id = clients.index(websocket) + 1
            # Send ping message to the specific client
            await websocket.send(f"Ping from server from client {client_id}")
            await asyncio.sleep(10)  # Ping every 10 seconds
    except websockets.ConnectionClosed:
        print(f"Client {clients.index(websocket) + 1} disconnected")
    finally:
        # Remove the client from the list on disconnection
        clients.remove(websocket)

        # Reassign client IDs after disconnection
        for i, client in enumerate(clients):
            print(f"Reassigning client {i + 1}")

# HTTP API handler
async def handle_send_input(request):
    return web.Response(text="Hello, World!")

# Main function to run both the WebSocket server and the HTTP server
async def main():
    # Start the WebSocket server
    websocket_server = websockets.serve(ping, "localhost", 8000)

    # Create an aiohttp application for the HTTP API
    app = web.Application()
    app.router.add_get('/send_input', handle_send_input)

    # Configure CORS
    cors = aiohttp_cors.setup(app)

    # Allow all origins (no restriction) for the /send_input route
    for route in list(app.router.routes()):
        cors.add(route, {
            "*": aiohttp_cors.ResourceOptions(allow_credentials=True, expose_headers="*", allow_headers="*")
        })

    # Run both WebSocket and HTTP servers concurrently
    await asyncio.gather(
        websocket_server,
        web._run_app(app, host='localhost', port=8080)
    )

if __name__ == "__main__":
    asyncio.run(main())
