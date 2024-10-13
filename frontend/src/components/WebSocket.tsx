import React, { useEffect, useState } from 'react';

const WebSocketComponent: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8000');
    
    websocket.onopen = () => {
      console.log('Connected to the WebSocket server');
    };

    websocket.onmessage = (event) => {
      setMessage(event.data);
    };

    websocket.onclose = () => {
      console.log('Disconnected from the WebSocket server');
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      websocket.close();
    };
  }, []);

  const callSendInputAPI = async () => {
    try {
      const response = await fetch('http://localhost:8080/send_input');
      const text = await response.text();
      setResponse(text);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  return (
    <div>
      <h1>WebSocket Ping</h1>
      {message ? <p>{message}</p> : <p>Waiting for a message...</p>}
      
      <h1>Call Send Input API</h1>
      <button onClick={callSendInputAPI}>Call API</button>
      {response && <p>Response from API: {response}</p>}
    </div>
  );
};

export default WebSocketComponent;
