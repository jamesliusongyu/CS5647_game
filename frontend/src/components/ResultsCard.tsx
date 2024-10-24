import React, { useState, useEffect } from 'react';
import '../styles/Results.css';

interface PlayerProps {
  username: string;
  audio: string;  // Base64 encoded string
  score1: number;
  score2: number;
}

interface ResultsCardProps {
  word: string;
  sample: string;  // Base64 encoded sample audio
  player1: PlayerProps;
  player2: PlayerProps;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ word, sample, player1, player2 }) => {
  const [sampleAudioURL, setSampleAudioURL] = useState<string | null>(null);
  const [player1AudioURL, setPlayer1AudioURL] = useState<string | null>(null);
  const [player2AudioURL, setPlayer2AudioURL] = useState<string | null>(null);

  useEffect(() => {
    console.log("Rendering ResultsCard");

    // Helper function to convert Base64 to Object URL
    const decodeBase64Audio = (base64String: string): string => {
      const binaryString = atob(base64String);
      const binaryLen = binaryString.length;
      const bytes = new Uint8Array(binaryLen);

      for (let i = 0; i < binaryLen; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    };

    // Decode and set the audio URLs
    if (sample) {
      setSampleAudioURL(decodeBase64Audio(sample));
    }
    if (player1.audio) {
      setPlayer1AudioURL(decodeBase64Audio(player1.audio));
    }
    if (player2.audio) {
      setPlayer2AudioURL(decodeBase64Audio(player2.audio));
    }

    // Clean up object URLs to prevent memory leaks
    return () => {
      if (sampleAudioURL) URL.revokeObjectURL(sampleAudioURL);
      if (player1AudioURL) URL.revokeObjectURL(player1AudioURL);
      if (player2AudioURL) URL.revokeObjectURL(player2AudioURL);
    };
  }, [sample, player1.audio, player2.audio]);

  return (
    <div className="card">
      <div className="panel-container">
        <div className="panel">
          <h1 className="result-word">{word}</h1>
          <h3 className="result-word">Sample Answer</h3>
          {sampleAudioURL && (
            <div className="audio-player">
              <audio controls src={sampleAudioURL} />
            </div>
          )}
        </div>
        <div className="panel">
          <div className="player-result">
            <h3 className="result-word">{player1.username}'s Answer</h3>
            {player1AudioURL && (
              <div className="audio-player">
                <audio controls src={player1AudioURL} />
              </div>
            )}
            <p className="result-word">Score: {player1.score1}</p>
            {/* <p className="result-word">Score 2: {player1.score2}</p> */}
          </div>
          <div className="player-result">
            <h3 className="result-word">{player2.username}'s Answer</h3>
            {player2AudioURL && (
              <div className="audio-player">
                <audio controls src={player2AudioURL} />
              </div>
            )}
            <p className="result-word">Score: {player2.score1}</p>
            {/* <p className="result-word">Score 2: {player2.score2}</p> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;
