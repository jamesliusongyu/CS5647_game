// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Matchmaking from './pages/Matchmaking';
import Match from './pages/Match';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import TopicSelection from './pages/TopicSelection';
import Round from './pages/Round';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Results from './pages/Results';
import Logo from './components/Logo';

const App: React.FC = () => {
  return (
    <WebSocketProvider>
    <div className='app container'>
      <Logo></Logo>
    <Router>
      <Routes>
        <Route path="/results" Component={Results} />
        <Route path="/matchmaking" Component={Matchmaking} />
        <Route path="/topicselection" Component={TopicSelection} />
        <Route path="/round" Component={Round} />
        <Route path="/match" Component={Match} />
        <Route path="/lobby" Component={Lobby} />
        <Route path="/" Component={Login} />
      </Routes>
    </Router>
    </div>
    </WebSocketProvider>
  );
};

export default App;
