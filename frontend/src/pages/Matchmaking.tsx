// src/pages/MatchmakingPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Matchmaking.css';
import { useWebSocket } from '../contexts/WebSocketContext';

const Matchmaking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use this to get the topic passed from TopicSelection
  const socket = useWebSocket(); // Retrieve WebSocket
  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<number>(1);
  const username = localStorage.getItem('username') || 'Player'; // Retrieve username from localStorage or default to 'Player'
  const selectedTopic = location.state?.topic || 'Random'; // Default to "Random" if no topic is selected
  const selectedMode = location.state?.selectedMode || 'Normal 1v1'; // Default to "Random" if no topic is selected



  useEffect(() => {
    if (socket) {
      // Send message to ask for invite code
      const message = JSON.stringify({
        action: 'create',
        username: username,
        topic: selectedTopic,
        gamemode: selectedMode
      });
      socket.send(message);

      
      // Listening to messages from WebSocket
      socket.onmessage = (event: { data: string; }) => {
        const data = JSON.parse(event.data);
        if (data.action === 'create' && data.code) {
          setCode(data.code)
        }
        if (data.status === 'success') {
          // Navigate to the match page on success
          setPlayers(2)
          navigate('/match',{ state: { selectedTopic, selectedMode, code } });
        } else if (data.status === 'error') {
          console.error(data.message); // Handle error message
        }
      };
    } else {
      // Handle the case where no WebSocket instance is available
      console.error("No WebSocket connection found.");
    }

    // Cleanup WebSocket event listeners when component unmounts
    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket, navigate]);

  return (
    <div className="box-container">
      <div className="white-box">
        <h1>{selectedMode.toUpperCase()}</h1>
        <div className="code-box">
          <h1>{code || 'Loading...'}</h1>
        </div>
        <p>Copy this code to join the match!</p>
        <p className="waiting-text">Waiting for players... ({players}/2)</p>
        <button className="cancel-button">CANCEL</button>
      </div>
    </div>
  );
};

export default Matchmaking;
