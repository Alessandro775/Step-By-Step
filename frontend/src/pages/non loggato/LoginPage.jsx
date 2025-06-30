import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
// URL base per le chiamate API al server backend
const BASE_URL = "http://localhost:3000";

//Componente LoginPage - Gestisce l'autenticazione degli utenti
const LoginPage = () => {
   // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
   // State per memorizzare i dati del form di login (email e password)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

   // State per gestire e visualizzare messaggi di errore durante il login
  const [error, setError] = useState("");
  // State per gestire lo stato di caricamento durante la richiesta API
  const [loading, setLoading] = useState(false);

  // Funzione per gestire i cambiamenti nei campi del form
  const handleChange = (e) => {
     // Aggiorna il valore del campo specifico mantenendo gli altri valori
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Pulisce l'errore quando l'utente inizia a digitare
    if (error) {
      setError("");
    }
  };
  // Funzione per gestire l'invio del form di login
  const handleSubmit = async (e) => {
     // Attiva lo stato di caricamento per disabilitare il form durante la richiesta
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
      // Converte la risposta in JSON
      const data = await response.json();
      // Verifica che non ci siano errori
      if (!response.ok) {
        throw new Error(data.error || "Errore login");
      }

      // Salva il token di autenticazione e il ruolo nel localStorage per persistenza
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
          // Fallback per ruoli non riconosciuti
          navigate("/");
      }
    } catch (error) {
        // Gestisce gli errori di login mostrando un messaggio all'utente
      console.error("Errore login:", error);
      setError(error.message || "Errore durante il login");
      // Disattiva lo stato di caricamento indipendentemente dal risultato
      setLoading(false); 
    }
  };

  return (
    //rederizzazione del form di login
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
