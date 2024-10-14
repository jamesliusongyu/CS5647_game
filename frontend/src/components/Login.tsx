// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>(""); // Stores user input
  const [randomUsername, setRandomUsername] = useState<string>(''); // Stores random username
  const navigate = useNavigate();

  // Function to generate random usernames using browser-safe Math.random()
  const generateRandomUsername = (): string => {
    const adjectives = ['Happy', 'Brave', 'Clever', 'Swift', 'Bold', 'Mighty'];
    const animals = ['Lion', 'Eagle', 'Wolf', 'Tiger', 'Panther', 'Fox'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomNum = Math.floor(Math.random() * 1000); // Random number suffix

    return `${randomAdj}${randomAnimal}${randomNum}`;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const finalUsername = username.trim() || randomUsername; // Use input or random username
    // Store the username in local storage
    localStorage.setItem('username', finalUsername);
    navigate('/lobby');
  };

  useEffect(() => {
    // Generate a random username when the component mounts
    const newRandomUsername = generateRandomUsername();
    setRandomUsername(newRandomUsername);
  }, []);

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="white-box">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={randomUsername} // Use random username as the placeholder
        />
        <button className="accent-button" type="submit">START</button>
      </form>
    </div>
  );
};

export default Login;
