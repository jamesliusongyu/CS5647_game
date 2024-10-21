// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import WebSocket from './components/WebSocket';
import Matchmaking from './components/Matchmaking';
import Match from './components/Match';
import Login from './components/Login';
import Lobby from './components/Lobby';
import TopicSelection from './components/TopicSelection';
import Round from './components/Round';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Results from './components/Results';

const App: React.FC = () => {
  return (
    <WebSocketProvider>
    <Router>
      <Routes>
        <Route path="/results" Component={Results} />
        <Route path="/matchmaking" Component={Matchmaking} />
        <Route path="/topicselection" Component={TopicSelection} />
        <Route path="/round" Component={Round} />
        <Route path="/match" Component={Match} />
        <Route path="/login" Component={Login} />
        <Route path="/lobby" Component={Lobby} />
        <Route path="/" Component={WebSocket} />
      </Routes>
    </Router>
    </WebSocketProvider>
  );
};

export default App;
