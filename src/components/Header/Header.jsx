import React from 'react';
import header from './header.module.css'; // Assuming you have a CSS module for styling


//dichiarazione di variabili e funzioni

const Header = () => {
    //qua va la dichiarazione delle variabili tramite hooks useState, useEffect, etc.
    //o funzioni per gestire eventi, fetch, etc.

    return (
        <header className={header.container}>
            <h1>Welcome to My Website</h1>
            <nav>
                <ul className="nav-list">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;