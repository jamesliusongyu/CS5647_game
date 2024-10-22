# --------------------------------------------------------------------
# Original Author: Xintong WANG
# Modified by: Xiaoteng LYU 
# Credits: Special thanks to Xintong WANG for her guidance
#          and contribution to speech assessment model of this project.
# --------------------------------------------------------------------
# The original code is contributed by Xintong WANG

import grpc

from . import service_pb2
from . import service_pb2_grpc

# This function makes a gRPC request to the server to fetch the assessment results
async def make_grpc_request(text: str, audio: bytes):
    # Asynchronously create a channel to connect to the gRPC server
    try:
        async with grpc.aio.insecure_channel('137.132.92.133:8888') as channel:
            # Create a stub (client)
            stub = service_pb2_grpc.ServiceStub(channel)
            
            # Create a request message
            request = service_pb2.Request(waveform=audio, text=text)
            response = await stub.Recognize(request)
            
            return parse_audio_data(response)
    except grpc.RpcError as e:
        print(f"gRPC error: {e.code()} - {e.details()}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

# This function parses the audio data and return average score
def parse_audio_data(response: bytes):
    ans = 0;
    n = 0;
    for char_info in response.scored_character:
        n = n + 1
        character = " ".join(char_info.reference_phone)
        score = round((char_info.score_phone[0] + char_info.score_phone[1]) // 2, 1)
        print(f"Character: {character}, Score: {score}")
        ans += score
    
    return ans / n

        