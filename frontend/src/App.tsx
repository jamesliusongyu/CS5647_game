// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import WebSocket from './components/WebSocket';
import Matchmaking from './components/Matchmaking';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/matchmaking" Component={Matchmaking} />
        <Route path="/" Component={WebSocket} />
      </Routes>
    </Router>
  );
};

export default App;
