// src/pages/MatchmakingPage.tsx
import React, { useEffect, useState } from 'react';
import '../styles/Matchmaking.css';

const Matchmaking: React.FC = () => {
  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<number>(1);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000');

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.code) {
        setCode(data.code); // Assuming the WebSocket sends the match code
      }
      if (data.players) {
        setPlayers(data.players); // Assuming the WebSocket sends player count
      }
    };

    return () => {
      websocket.close();
    };
  }, []);

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
