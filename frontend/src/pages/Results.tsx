// src/pages/Results.tsx
import React, { useState, useEffect } from 'react';
import '../styles/Results.css';
import ResultsCard from '../components/ResultsCard';

const Results: React.FC = () => {
    // sample data
    const data = [
        {
            word: "chicken",
            sample: "audiourl1",
            player1: {
                username: "xxx",
                audio: "audiourl1",
                score1: 0.9,
                score2: 0.8,
            },
            player2: {
                username: "yyy",
                audio: "audiourl2",
                score1: 0.5,
                score2: 0.4,
            }
        },
        {
            word: "rice",
            sample: "audiourl4",
            player1: {
                username: "xxx",
                audio: "audiourl1",
                score1: 0.9,
                score2: 0.8,
            },
            player2: {
                username: "yyy",
                audio: "audiourl2",
                score1: 0.5,
                score2: 0.4,
            }
        }
    ];



    useEffect(() => {

    }, []);

    return (
        <div className="container">
            <div className="white-box">
                <h1>Results</h1>
                {data.map((item, index) => (
                    <ResultsCard
                        key={index} // Use index as key if items are not guaranteed to have unique IDs
                        word={item.word}
                        sample={item.sample}
                        player1={item.player1}
                        player2={item.player1}
                    />
                ))}
                <div className="final-result">
                    <h1>Final Result</h1>
                    <h1>xxx Wins!</h1>
                </div>
            </div>
        </div>
    );
};

export default Results;
