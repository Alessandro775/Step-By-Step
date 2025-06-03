import React from 'react';
import header from './header.module.css'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-removebg-preview.png' 

//dichiarazione di variabili e funzioni

const Header = () => {
    const navigate = useNavigate();


    // Funzioni per la navigazione
    const goToHome = () => navigate('/');
    const goToLogin = () => navigate('/chi siamo');
    const goToProfile = () => navigate('/esempio esercizio');
    const goToPractice = () => navigate('/login');

    return (
        <header className={header.container}>
            {/* Modifica l'immagine wrappandola in un button */}
            <button 
                onClick={goToHome} 
                className={header.logoButton}
            >
                <img src={logo} alt="Logo" className={header.logo} />
            </button>
            <h1 className={header.title}>Step By Step</h1>
                <nav>
                <ul className={header['nav-list']}>
                    <li><button onClick={goToLogin}>Chi siamo</button></li>
                    <li><button onClick={goToProfile}>Esempio esercizio</button></li>
                    <li><button onClick={goToPractice}>Login</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;