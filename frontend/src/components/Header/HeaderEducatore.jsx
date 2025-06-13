import React from 'react';
import header from './header.module.css'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logosito.png' 

//dichiarazione di variabili e funzioni

const HeaderEducatore = () => {
    const navigate = useNavigate();


    // Funzioni per la navigazione
    const goToHome = () => navigate('/');
    const goToStudenti = () => navigate('/studenti-educatore');
    const goToContenuti = () => navigate('/contenuto-educatore');
    const goToProfilo = () => navigate('/profilo-educatore');
    
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
                    <li><button onClick={goToStudenti}>Studenti</button></li>
                    <li><button onClick={goToContenuti}>Contenuti degli esercizi</button></li>                    
                    <li><button onClick={goToProfilo}>Profilo utente</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default HeaderEducatore;