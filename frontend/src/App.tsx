// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import WebSocket from './components/WebSocket';
import Matchmaking from './components/Matchmaking';
import Login from './components/Login';
import Lobby from './components/Lobby';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/matchmaking" Component={Matchmaking} />
        <Route path="/login" Component={Login} />
        <Route path="/lobby" Component={Lobby} />
        <Route path="/" Component={WebSocket} />
      </Routes>
    </Router>
  );
};

export default App;
