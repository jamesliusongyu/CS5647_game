# src/cors/cors_setup.py
import aiohttp_cors

# Function to configure CORS
def configure_cors(app):
    # Set up CORS for aiohttp
    cors = aiohttp_cors.setup(app)
    
    # Allow all origins (no restriction) for all routes
    for route in list(app.router.routes()):
        cors.add(route, {
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*"
            )
        })
