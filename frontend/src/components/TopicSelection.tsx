import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopicSelection.css'; // Ensure to create this CSS file for styling

const TopicSelection: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const navigate = useNavigate();

  const topics = ['Random', 'Travel', 'Food'];

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    // Navigate to matchmaking and pass the selected topic
    navigate('/matchmaking', { state: { topic } });
  };

  return (
    <div className="topic-selection-container">
      <div className="header"></div>
      <h2 className="match-title">NORMAL 1V1</h2>
      <h3 className="select-topic-text">Select a topic:</h3>
      <div className="topics-panel">
        {topics.map((topic, index) => (
          <div
            key={index}
            className={`topic-box ${selectedTopic === topic ? 'selected' : ''}`}
            onClick={() => handleTopicClick(topic)}
          >
            {topic}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicSelection;
