// src/pages/Results.tsx
import React, { useState, useEffect } from 'react';
import '../styles/Results.css';
import ResultsCard from '../components/ResultsCard';

const Results: React.FC = () => {
    // sample data
    const data = [
        {
            word: "苹果",
            sample: "audiourl1",
            player1: {
                username: "Shanny",
                audio: "audiourl1",
                score1: 91,
                score2: 80,
            },
            player2: {
                username: "BraveEagle957",
                audio: "audiourl2",
                score1: 55,
                score2: 43,
            }
        },
        {
            word: "香蕉",
            sample: "audiourl4",
            player1: {
                username: "Shanny",
                audio: "audiourl1",
                score1: 93,
                score2: 79,
            },
            player2: {
                username: "BraveEagle957",
                audio: "audiourl2",
                score1: 65,
                score2: 55,
            }
        }
    ];



    useEffect(() => {

    }, []);

    return (
        <div className="container">
            <div className="white-box">
                <h1>Results</h1>
                <div className="results">
                    {data.map((item, index) => (
                        <ResultsCard
                            key={index} // Use index as key if items are not guaranteed to have unique IDs
                            word={item.word}
                            sample={item.sample}
                            player1={item.player1}
                            player2={item.player2}
                        />
                    ))}
                </div>
                <div className="final-result">
                    <h1>Final Result</h1>
                    <h1 className="pink">Shanny Wins!</h1>
                </div>
            </div>
        </div>
    );
};

export default Results;
