import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext'; // Assuming you have a WebSocket context
import '../styles/Round.css';
import { useLocation, useNavigate } from 'react-router-dom';

const Round: React.FC = () => {
  const [countdown, setCountdown] = useState<number>(5); // 5-second countdown for recording
  const [words, setWords] = useState<{ text: string; pinyin: string }[]>([]); // State to hold the array of word objects with text and pinyin
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0); // Track the current word's index
  const [isRecording, setIsRecording] = useState<boolean>(false); // Whether the user is currently recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Ref to hold the MediaRecorder instance
  const [audioURL, setAudioURL] = useState<string | null>(null); // To store the recorded audio URL
  const socket = useWebSocket(); // Get WebSocket instance from the context
  const [score, setScore] = useState<number | null>(null); // State to store the score
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // To control the modal visibility
  const [isLoading, setIsLoading] = useState<boolean>(false); // To show loading spinner
  const location = useLocation(); // Use this to get the topic passed from TopicSelection
  const selectedTopic = location.state?.selectedTopic || 'Random'; // Default to "Random" if no topic is selected
  const selectedMode = location.state?.selectedMode || 'Normal 1v1'; // Default to "Random" if no topic is selected
  const gameCode = location.state?.gameCode || ''; // Default to " " if no code"
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the words when the component mounts
    const callGetTopicWordsAPI = async () => {
      try {
          const response = await fetch(`http://localhost:8080/get_normal_1v1_words?topic=${selectedTopic}`);
          const data = await response.json(); // Parse the JSON response
          console.log(data, "dataaa")
          setWords(data); // Assuming data.words is the array of words

      } catch (error) {
        console.error("Error calling API:", error);
        setWords([{ text: 'Error', pinyin: '' }]); // Set a default word if there's an error
      }
    };

    callGetTopicWordsAPI();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown > 1) return prevCountdown - 1;
          stopRecording(); // Automatically stop recording when the countdown reaches 0
          return 0;
        });
      }, 1000);
    }

    return () => clearInterval(timer); // Cleanup on component unmount
  }, [isRecording]);

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Listen to WebSocket for score response
  useEffect(() => {
    if (socket) {
      socket.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.action === 'score') {
          // wait 2 seconds to demonstrate the loading works
          // await sleep(2000);
          setIsLoading(false); // Stop loading once the score is received
          openScoreModal(data.score['overall']);
        }
      };
    }
  }, [socket]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setCountdown(5); // Reset the countdown to 5 seconds

      mediaRecorder.start();

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL); // Set the audio URL for playback
        setIsRecording(false);

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob); // This will read the blob as a base64-encoded string
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1]; // Extract the base64-encoded part
          if (base64Audio) {
            // Create the JSON message to include the word and the base64 audio
            const message = {
              action: 'audio_input',
              word: words[currentWordIndex],
              audio: base64Audio, // Send audio as Base64
            };

            // Send the JSON object via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(message));
              console.log('Audio and word sent via WebSocket :' + currentWordIndex);
              setIsLoading(true); // Start loading after sending audio
            } else {
              console.error('WebSocket connection is not open');
            }
          }
        };
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // Stop recording
    }
  };

  // Open modal to display the score
  const openScoreModal = (receivedScore: number) => {
    setScore(receivedScore);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1); // move to the next word
      setAudioURL(null);
      setScore(null);
    } else {
        console.log("All words completed");
        navigate('/results', {state: {selectedMode, selectedTopic, code: gameCode}});
      }
};

return (
  <div className="box-container">
    <div className="centered-inline">
      <h2>{`Round ${currentWordIndex + 1} / ${words.length}`}</h2> {/* Display current round */}
    </div>
    <div className="white-box">
      <h1>{selectedMode.toUpperCase()}</h1>

      <h3 className="instruction-text">Pronounce this word:</h3>

      <div className="word-box">
        {words.length > 0 ? (
          <>
            <p>{words[currentWordIndex].pinyin}</p> {/* Display the pinyin below the word */}

            <h1>{words[currentWordIndex].text}</h1>
          </>
        ) : (
          <h1>Loading...</h1>
        )}
      </div>

      <div>
        <div className="countdown-circle">
          <span>{countdown}</span>
        </div>
      </div>

      <div>
        <button className="record-button" onClick={startRecording} disabled={isRecording || isLoading}>
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
      </div>

      {/* {audioURL && (
        <div className="round audio-player">
          <audio controls src={audioURL} />
        </div>
      )} */}
    </div>

    {isLoading && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Loading...</h3>
          <p>Please wait while we process your audio</p>
        </div>
      </div>
    )}

    {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Your score: {score}</h3>
          <button onClick={closeModal}>Next Stage</button>
        </div>
      </div>
    )}
  </div>
);
};

export default Round;