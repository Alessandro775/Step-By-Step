import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
const BASE_URL ="http://localhost:3000";

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Email:", formData.email);
    console.log("Password:", formData.password);
    
    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Errore login');
        }

        // Salva il token e il ruolo
        localStorage.setItem('token', data.token);
        localStorage.setItem('ruolo', data.ruolo);

        // Reindirizza in base al ruolo
        switch (data.ruolo) {
            case 'S':
                navigate('/home-studente');
                break;
            case 'E':
                navigate('/studenti-educatore');
                break;
            case 'G':
                navigate('/home-famiglia');
                break;
            default:
                navigate('/');
        }

    } catch (error) {
        console.error('Errore login:', error);
        // Qui puoi aggiungere un feedback visuale per l'utente
    }
};

    return (
        <div className={styles["login-container"]}>
            <form className={styles['login-form']} onSubmit={handleSubmit}>
                <h2>Login</h2>
                <div className={styles["form-group"]}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                 />
            </div>
            <div className={styles["form-group"]}>
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>
            <button type="submit">Invia</button>
            <div className={styles.divider}>
             <span>Non hai un account?</span>
            </div>
            <button type="button" onClick={() => window.location.href = '/registrazione'}>Registrati</button>
            </form>
        </div>
    );
    
};

export default LoginPage;