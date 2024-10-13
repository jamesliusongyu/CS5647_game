# src/main.py
import asyncio
from aiohttp import web
import websockets

from api.api_handler import handle_send_input
from cors.cors_setup import configure_cors
from matchmaking.matchmaking_handler import handle_websocket_ping

# Function to set up the HTTP server with CORS enabled
def setup_http_server():
    app = web.Application()

    # Set up the HTTP routes
    app.router.add_get('/send_input', handle_send_input)

    # Configure CORS for the application
    configure_cors(app)
    
    return app

# Main function to start both WebSocket and HTTP servers
async def start_servers():
    # Start the WebSocket server
    websocket_server = websockets.serve(handle_websocket_ping, "localhost", 8000)

    # Set up the HTTP server
    http_app = setup_http_server()

    # Run both WebSocket and HTTP servers concurrently
    await asyncio.gather(
        websocket_server,
        web._run_app(http_app, host='localhost', port=8080)
    )

if __name__ == "__main__":
    # Run the main server loop
    asyncio.run(start_servers())
