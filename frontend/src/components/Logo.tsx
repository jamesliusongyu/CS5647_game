import React from 'react';
import logo from '../assets/logo.png'
import '../App.css'

const Logo: React.FC = () => {

    return (
        <div className="logo-container">
           <img className="logo" src={logo}></img>
        </div>
    );
};

export default Logo;
