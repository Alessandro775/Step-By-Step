import React from 'react';
import header from './header.module.css'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/adesivi-murali-inter-de-milan-new-stemma.png'  // adjust the path based on your logo location


//dichiarazione di variabili e funzioni

const Header = () => {
    const navigate = useNavigate();


    // Funzioni per la navigazione
    const goToHome = () => navigate('/home');
    const goToLogin = () => navigate('/login');
    const goToProfile = () => navigate('/profile');
    const goToPractice = () => navigate('/practice');

    return (
        <header className={header.container}>
            <img src={logo} alt="Logo" className={header.logo} />
            <h1 className={header.title}>Step By Step</h1>
                <nav>
                <ul className={header['nav-list']}>
                    <li><button onClick={goToHome}>Home</button></li>
                    <li><button onClick={goToLogin}>Login</button></li>
                    <li><button onClick={goToProfile}>Profile</button></li>
                    <li><button onClick={goToPractice}>Practice</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;