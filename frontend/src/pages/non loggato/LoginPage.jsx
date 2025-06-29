import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
// URL base per le chiamate API
const BASE_URL = "http://localhost:3000";

const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Aggiungi stato per gestire gli errori
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Stato per i dati del form di login
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Pulisce l'errore quando l'utente inizia a digitare
    if (error) {
      setError("");
    }
  };
  // Gestisce l'invio del form di login
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chiamata API per il login
    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore login");
      }

      // Salva token e ruolo nel localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("ruolo", data.ruolo);

      // Reindirizza in base al ruolo utente
      switch (data.ruolo) {
        case "S":
          navigate("/home-studente");
          break;
        case "E":
          navigate("/home-educatore");
          break;
        case "G":
          navigate("/home-famiglia");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      console.error("Errore login:", error);
      setError(error.message || "Errore durante il login");
      setLoading(false); // Aggiungi anche questo se usi loading
    }
  };

  return (
    //Struttura del form di login
    <div className={styles["login-container"]}>
      <form className={styles["login-form"]} onSubmit={handleSubmit}>
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
        {/* pulsante di login con eventuali messaggi i errori  */}
        {error && <div className={styles["error-message"]}>{error}</div>}
        <button type="submit">Invia</button>
        <div className={styles.divider}>
          {/* indirizzamento alla pagina di registrazione */}
          <span>Non hai un account?</span>
        </div>
        <button
          type="button"
          onClick={() => (window.location.href = "/registrazione")}
        >
          Registrati
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
