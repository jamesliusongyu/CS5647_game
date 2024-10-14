// src/pages/MatchmakingPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Matchmaking.css';
import { useWebSocket } from '../contexts/WebSocketContext';

const Matchmaking: React.FC = () => {
  const navigate = useNavigate();
  const socket = useWebSocket(); // Retrieve WebSocket
  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<number>(1);


  useEffect(() => {
    if (socket) {
      // Send message to ask for invite code
      const message = JSON.stringify({
        action: 'create'
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
          navigate('/match');
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
    <div className="matchmaking-container">
      <div className="matchmaking-box">
        <h2>Normal 1v1</h2>
        <div className="code-box">
          <h1>{code || 'Loading...'}</h1>
        </div>
        <p>Copy this code to join the match!</p>
        <p className="waiting-text">Waiting for players... ({players}/2)</p>
        <button className="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

export default Matchmaking;
