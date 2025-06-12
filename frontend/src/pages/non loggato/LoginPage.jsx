import React, { useState } from 'react';
import styles from './LoginPage.module.css';

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add your login logic here
        console.log('Login attempt with:', formData);
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