import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext'; // Assuming you have a WebSocket context
import '../styles/Round.css';
import { useLocation, useNavigate } from 'react-router-dom';

const DialogueRound: React.FC = () => {
  const [countdown, setCountdown] = useState<number>(5); // 5-second countdown for recording
  const [words, setWords] = useState<string[]>([]); // State to hold the array of words
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
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
  const playerRole = location.state?.role || 'q'; // Default to "Random" if no topic is selected
  const [dialogues, setDialogues] = useState<{
    pinyin: string; role: string; text: string 
}[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the dialogue data on mount
    const callGetTopicWordsAPI = async () => {
      try {
        console.log(selectedTopic, "selecetedTopic")
        const response = await fetch(`http://localhost:8080/get_dialogue_1v1_words?topic=${selectedTopic}`);
        const data = await response.json();
        console.log(data);
        setDialogues(data);
      } catch (error) {
        console.error("Error calling API:", error);
        setDialogues([{
          role: playerRole, text: 'Error',
          pinyin: ''
        }]);
      }
    };

    callGetTopicWordsAPI();
  }, [playerRole]);

  const filteredDialogues = dialogues.filter(d => d.role === playerRole);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown > 1) return prevCountdown - 1;
          stopRecording();
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  useEffect(() => {
    if (socket) {
      socket.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.action === 'score') {
          await sleep(2000);
          setIsLoading(false);
          openScoreModal(data.score);
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
      setCountdown(5);

      mediaRecorder.start();

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        setIsRecording(false);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            const message = {
              action: 'audio_input',
              gameMode: selectedMode,
              word: { text: filteredDialogues[currentDialogueIndex].text, pinyin: filteredDialogues[currentDialogueIndex].pinyin },
              order: currentDialogueIndex,
              playerRole: playerRole,
              audio: base64Audio,
            };
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(message));
              console.log('Audio and word sent via WebSocket');
              setIsLoading(true);
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
      mediaRecorderRef.current.stop();
    }
  };

  const openScoreModal = (receivedScore: number) => {
    setScore(receivedScore);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (currentDialogueIndex < filteredDialogues.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
      setAudioURL(null);
      setScore(null);
    } else {
      console.log("All dialogues completed");
      navigate('/results', { state: { selectedMode, selectedTopic, code: gameCode } });
    }
  };

  return (
    <div className="box-container">
      <div className="white-box">
        <h1>{selectedMode.toUpperCase()}</h1>
        <h3 className="instruction-text">Pronounce this sentence:</h3>
        <div className="word-box">
          <h3>{filteredDialogues.length > 0 ? filteredDialogues[currentDialogueIndex].pinyin : 'Loading...'}</h3>
          <h1>{filteredDialogues.length > 0 ? filteredDialogues[currentDialogueIndex].text : 'Loading...'}</h1>
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
        {audioURL && (
          <div className="round audio-player">
            <audio controls src={audioURL} />
          </div>
        )}
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

export default DialogueRound;