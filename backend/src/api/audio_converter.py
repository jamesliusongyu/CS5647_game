import io
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

# Function to convert a wav audio data to 16kHz 16-bit format
# Keep this in case we can directly get a webm file from the frontend
# If this is not needed we dont need scipy and numpy from dependencies
def convert_wav_to_16kHz_16bit(byte_data):
    # Convert the byte data to numpy array (this assumes you have wav formatted data)
    audio_stream = io.BytesIO(byte_data)
    
    # Read the original WAV file
    original_sample_rate, audio_data = wavfile.read(audio_stream)

    # Check if audio is stereo and convert to mono by averaging both channels
    if len(audio_data.shape) > 1:
        audio_data = audio_data.mean(axis=1)

    # Resample the audio to 16kHz
    target_sample_rate = 16000
    audio_resampled = signal.resample_poly(audio_data, target_sample_rate, original_sample_rate)

    # Convert the resampled data to 16-bit PCM format
    audio_16bit = np.int16(audio_resampled / np.max(np.abs(audio_resampled)) * 32767)

    # Save the result as a new WAV file in memory
    output_stream = io.BytesIO()
    wavfile.write(output_stream, target_sample_rate, audio_16bit)

    # Return the converted audio data as bytes
    return output_stream.getvalue()

# Function to convert WebM bytes to WAV bytes in 16kHz 16-bit format using ffmpeg
def convert_webm_to_wav(webm_bytes):
    # Define the ffmpeg command
    ffmpeg_command = [
        'ffmpeg',
        '-i', 'pipe:0',             # Read input from stdin (pipe)
        '-ar', '16000',             # Set audio sample rate to 16kHz
        '-acodec', 'pcm_s16le',     # Set the audio codec to PCM 16-bit little-endian
        '-f', 'wav',                # Output format is WAV
        'pipe:1'                    # Write output to stdout (pipe)
    ]

    # Use subprocess to run the ffmpeg command with piping
    process = subprocess.Popen(
        ffmpeg_command,
        stdin=subprocess.PIPE,    # ffmpeg reads from this pipe (WebM input)
        stdout=subprocess.PIPE,   # ffmpeg writes to this pipe (WAV output)
        stderr=subprocess.PIPE    # Capture any error output
    )

    # Send WebM bytes to ffmpeg's stdin and get the WAV bytes from stdout
    wav_bytes, error = process.communicate(input=webm_bytes)

    # Check for errors during conversion
    if process.returncode != 0:
        print(f"ffmpeg error: {error.decode()}")
        return None
    
    return wav_bytes
