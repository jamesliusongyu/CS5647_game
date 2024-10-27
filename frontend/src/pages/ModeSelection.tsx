import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopicSelection.css'; // Ensure to create this CSS file for styling

const ModeSelection: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();

  const mode = ['Normal 1v1', 'Dialogue 1v1'];

  const handleModeClick = (mode: string) => {
    setSelectedMode(mode);
    localStorage.setItem("gamemode", mode)
    // Navigate to matchmaking and pass the selected topic
    navigate('/topicselection', { state: { mode } });
  };

  return (
    <div className="box-container">
      <div className="white-box">
        <h1>GAME MODE</h1>
        <h3 className="select-topic-text">Select a game mode:</h3>
        <div className="topics-panel">
          {mode.map((mode, index) => (
            <div
              key={index}
              className={`topic-box ${selectedMode === mode.toUpperCase() ? 'selected' : ''}`}
              onClick={() => handleModeClick(mode)}
            >
              {mode}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
