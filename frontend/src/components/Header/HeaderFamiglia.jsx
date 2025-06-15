import React from 'react';
import header from './header.module.css'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logosito.png' 

//dichiarazione di variabili e funzioni

const HeaderFamiglia = () => {
    const navigate = useNavigate();


    // Funzioni per la navigazione
    const goToHome = () => navigate('/home-famiglia');
    const goToProfilo = () => navigate('/profilo-famiglia');

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
                    <li><button onClick={goToProfilo}>Profilo utente</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default HeaderFamiglia;