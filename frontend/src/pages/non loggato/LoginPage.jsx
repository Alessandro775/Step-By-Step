import React, { useState } from 'react';
import styles from './LoginPage.module.css';
const BASE_URL ="http://localhost:3000";
const LoginPage = () => {
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
        const formEmail = formData.email;
        console.log(formEmail)
        const formPassword = formData.password;
        console.log(formPassword)
        console.log('Login attempt with:', formData);
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formEmail,
                password: formPassword
            })
        });
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
            <a href="#" className={styles["forgot-password"]}>Hai dimenticato la password?</a>
            <button type="button" onClick={() => window.location.href = '/registrazione'}>Registrati</button>
            </form>
        </div>
    );
};

export default LoginPage;