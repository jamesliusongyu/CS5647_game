import React, { useEffect, useState } from 'react';
import '../styles/Results.css';

interface PlayerProps {
  username: string;
  audio: string;  // Base64 encoded string
  score1: number;
  score2: number;
  word: string;
  pinyin: string;
  order: string;
  playerRole: string;
  sample : string;
}

interface ResultsCardProps {
  word: string;
  pinyin : string;
  sample: string;  // Base64 encoded sample audio
  player1: PlayerProps;
  player2: PlayerProps;
}

const ResultsCard: React.FC<ResultsCardProps> = ({ word, pinyin, sample, player1, player2 }) => {
  const [sampleAudioURL1, setSampleAudioURL1] = useState<string | null>(null);
  const [sampleAudioURL2, setSampleAudioURL2] = useState<string | null>(null);

  const [player1AudioURL, setPlayer1AudioURL] = useState<string | null>(null);
  const [player2AudioURL, setPlayer2AudioURL] = useState<string | null>(null);

  const displayWord1 = word || player1.word;
  const displayWord2 = displayWord1 === (word || player2.word) ? null : word || player2.word;

  const sampleWord1 = sample || player1.sample
  const sampleWord2 = sampleWord1 === (sample || player2.sample) ? null: sample || player2.sample;

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
    if (sampleWord1) {
      setSampleAudioURL1(decodeBase64Audio(sampleWord1));
    }
    if (sampleWord2) {
      setSampleAudioURL2(decodeBase64Audio(sampleWord2));
    }
    if (player1.audio) {
      setPlayer1AudioURL(decodeBase64Audio(player1.audio));
    }
    if (player2.audio) {
      setPlayer2AudioURL(decodeBase64Audio(player2.audio));
    }

    // Clean up object URLs to prevent memory leaks
    return () => {
      if (sampleAudioURL1) URL.revokeObjectURL(sampleAudioURL1);
      if (sampleAudioURL2) URL.revokeObjectURL(sampleAudioURL2);

      if (player1AudioURL) URL.revokeObjectURL(player1AudioURL);
      if (player2AudioURL) URL.revokeObjectURL(player2AudioURL);
    };
  }, [sample, player1.audio, player2.audio]);

  return (
    <div className="card">
      <div className="panel-container">
        <div className="panel">
        <h3 className="result-word">{pinyin}</h3>

          <h2 className="result-word">{displayWord1}</h2>
          <h2 className="result-word">{displayWord2}</h2>

          <h3 className="result-word">Sample Answer</h3>
          {sampleAudioURL1 && (
            <div className="audio-player">
              <audio controls src={sampleAudioURL1} />
            </div>
          )}
           {sampleAudioURL2 && (
            <div className="audio-player">
              <audio controls src={sampleAudioURL2} />
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
