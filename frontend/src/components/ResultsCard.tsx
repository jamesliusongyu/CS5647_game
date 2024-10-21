// component
import React, { useState, useEffect } from 'react';
import '../styles/Results.css';

interface PlayerProps {
    username: string;
    audio: string;
    score1: number;
    score2: number;
  }
  
  interface ResultsCardProps {
    word: string;
    sample: string;
    player1: PlayerProps;
    player2: PlayerProps;
  }

const ResultsCard: React.FC<ResultsCardProps> = ({ word, sample, player1, player2 }) => {

    useEffect(() => {

    }, []);

    return (
        <div className="card">
            <div className="panel-container">
                <div className="panel">
                    <h1 className="result-word">{word}</h1>
                    <h3 className="result-word">Sample Answer</h3>
                    {(
                        <div className="audio-player">
                            <audio controls src={sample} />
                        </div>
                    )}
                </div>
                <div className="panel">
                    <div className="player-result">
                        <h3 className="result-word">{player1.username}'s Answer</h3>
                        {(
                            <div className="audio-player">
                                <audio controls src={player1.audio} />
                            </div>
                        )}
                         <p className="result-word">Score 1</p>
                         <p className="result-word">{player1.score1}</p>
                         <p className="result-word">Score 2</p>
                         <p className="result-word">{player1.score2}</p>

                    </div>
                    <div className="player-result">
                        <h3 className="result-word">{player2.username}'s Answer</h3>
                        {(
                            <div className="audio-player">
                                <audio controls src={player2.audio} />
                            </div>
                        )}
                        <p className="result-word">Score 1</p>
                         <p className="result-word">{player2.score1}</p>
                         <p className="result-word">Score 2</p>
                         <p className="result-word">{player2.score2}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ResultsCard;
