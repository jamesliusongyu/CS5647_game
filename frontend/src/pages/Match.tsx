import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Match.css';
import { useWebSocket } from '../contexts/WebSocketContext'; // Assuming you have a WebSocket context

const Match: React.FC = () => {
  const [countdown, setCountdown] = useState<number>(5); // Countdown starts at 5 seconds
  const [opponent, setOpponent] = useState<string>('Player B'); // Placeholder for opponent name
  const [localPlayer, setLocalPlayer] = useState<string>('You'); // Local player's name
  const navigate = useNavigate();
  const location = useLocation(); // Use this to get the topic passed from TopicSelection
  const selectedTopic = location.state?.topic || 'Random'; // Default to "Random" if no topic is selected

  const clientId = localStorage.getItem('client_id') || '';
  const storedUsername = clientId.split('_')[1] || 'You'; // Extract username from client_id
  
  const socket = useWebSocket(); // Access WebSocket instance from context

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    if (countdown === 0) {
      clearInterval(timer);
      navigate('/round' ,{ state: { selectedTopic } });
    }

    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, [countdown, navigate]);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data)
        if (data.action === 'start' && data.username1 && data.username2) {
          // Determine if stored username is player1 or player2 and set opponent accordingly
          if (data.username1.includes(storedUsername)) {
            setLocalPlayer(storedUsername);
            setOpponent(data.username2.split('_')[1] || 'Player B');
          } else {
            setLocalPlayer(data.username2.split('_')[1] || 'You');
            setOpponent(data.username1.split('_')[1] || 'Player B');
          }
        }
      };
    }

    return () => {
      if (socket) {
        socket.onmessage = null; // Clean up WebSocket listener on unmount
      }
    };
  }, [socket, storedUsername]);

  return (
    <div className="box-container">
      <div className="white-box">
      <h1>NORMAL 1V1</h1>
      <div className="match-panel">
        <div className="player-box">
          <div className="player">{localPlayer}</div>
        </div>
        <div className="vs">VS</div>
        <div className="player-box">
          <div className="player">{opponent}</div>
        </div>
      </div>
      <div className="countdown">{countdown}</div>
      </div>
    </div>
  );
};

export default Match;
