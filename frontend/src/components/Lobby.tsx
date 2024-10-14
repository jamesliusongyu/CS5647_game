// src/pages/RoomSelection.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Lobby: React.FC = () => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    navigate('/matchmaking'); // Player A creates a room and goes to matchmaking
  };

  const handleJoinRoom = () => {
    if (inviteCode.trim()) {
      // Pass the invite code to matchmaking to join the same room
      navigate(`/matchmaking/${inviteCode}`);
    }
  };

  return (
    <div className="container">
      <div className="white-box">
        <h1>Lobby</h1>
        <div className="panel-container">
        <div className="panel">
          <button className="accent-button" onClick={handleCreateRoom}>Create Room</button>
        </div>
        <div className="panel">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
          />
          <button className="accent-button" onClick={handleJoinRoom}>Join Room</button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
