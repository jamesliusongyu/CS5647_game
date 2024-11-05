import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/TopicSelection.css'; // Ensure to create this CSS file for styling

const TopicSelection: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedMode = location.state?.mode || 'Normal 1v1'; // Default to "Normal 1v1" if no mode is provided

  // Define topic sets
  const normalVocabTopics = ['Education', 'Work', 'Health', 'Travel', 'Culture', 'Technology', 'Environment', 'Food'];
  const dialogueVocabTopics = ['Health', 'Work', 'Food', 'Culture', 'Travel'];

  // Determine which topics to display based on selectedMode
  const topics = selectedMode === 'Normal 1v1' ? normalVocabTopics : dialogueVocabTopics;

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    const role = "question";
    // Navigate to matchmaking and pass the selected topic
    navigate('/matchmaking', { state: { topic, selectedMode, role } });
  };

  return (
    <div className="box-container">
      <div className="white-box">
        <h1>{selectedMode.toUpperCase()}</h1>
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
    </div>
  );
};

export default TopicSelection;
