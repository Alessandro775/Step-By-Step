import React from 'react';
import header from './header.module.css'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logosito.png' 

//dichiarazione di variabili e funzioni

const Header = () => {
    const navigate = useNavigate();

    // Funzioni per la navigazione
    const goToHome = () => navigate('/');
    const goToChiSiamo = () => navigate('/chi-siamo');
    const goToEsercizi = () => navigate('/esempio-esercizio');
    const goToLogin = () => navigate('/login');

    return (
        <header className={header.container}>
            {/*logo cliccabile*/}
            <button 
                onClick={goToHome} 
                className={header.logoButton}
            >
                <img src={logo} alt="Logo" className={header.logo} /> {/*immagine del logo*/}
            </button>
            <h1 className={header.title}>Step By Step</h1>
                <nav>
                {/*bottoni per navigare nelle varie pagine*/}
                <ul className={header['nav-list']}>
                    <li><button onClick={goToChiSiamo}>Chi siamo</button></li>
                    <li><button onClick={goToEsercizi}>Esempi esercizi</button></li>
                    <li><button onClick={goToLogin}>Login</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;