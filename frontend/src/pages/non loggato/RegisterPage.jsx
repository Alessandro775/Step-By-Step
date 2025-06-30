import React, { useState } from "react";
import styles from "./RegisterPage.module.css";
import { useNavigate } from "react-router-dom";

// URL base per le chiamate API al server backend;
const BASE_URL = "http://localhost:3000";

//Componente RegisterPage - Gestisce la registrazione di nuovi utenti
const RegisterPage = () => {
  // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
  // Stati per i campi comuni del form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [tipoUtente, setTipoUtente] = useState("");

  // Stati specifici per studenti ed educatori
  const [istituto, setIstituto] = useState("");
  const [classe, setClasse] = useState("");
  const [annoScolastico, setAnnoScolastico] = useState("");

  // Stati specifici per genitori
  const [numero_telefono, setnumero_telefono] = useState("");
  const [email_studente, setemail_studente] = useState("");

  // Gestione errori 
  const [errors, setErrors] = useState({});

  // Funzione per validare che le password inserite corrispondano
  const validatePasswords = () => {
    const newErrors = {};
    // Verifica corrispondenza password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Le password non corrispondono";
    }
     // Aggiorna lo state degli errori
    setErrors(newErrors);
     // Restituisce true se non ci sono errori
    return Object.keys(newErrors).length === 0;
  };

  // Funzione principale per gestire l'invio del form di registrazione
  const handleSubmit = async (e) => {
     // Previene il comportamento di default del form
    e.preventDefault();
    console.log(BASE_URL);
    // Verifica che le password corrispondano
    if (!validatePasswords()) {
      return;
    }

    try {
      // Costruisce l'oggetto userData in base al tipo di utente
      const userData = {
        // Nome non richiesto per i genitori
        ...(tipoUtente !== "genitore" && { nome }),
        cognome,
        email,
        password,
        // Mappa il tipo utente al codice ruolo
        ruolo:
        
          tipoUtente === "studente"
            ? "S"
            : tipoUtente === "educatore"
            ? "E"
            : "G",
            // Campi specifici per studenti
        ...(tipoUtente === "studente" && {
          istituto,
          classe: parseInt(classe),
          anno_scolastico: parseInt(annoScolastico),
        }),
         // Campi specifici per educatori
        ...(tipoUtente === "educatore" && { istituto }),
         // Campi specifici per genitori/famiglie
        ...(tipoUtente === "genitore" && {
          numero_telefono,
          email_studente,
          cognome_famiglia: cognome,
        }),
      };

      console.log("=== REGISTRAZIONE ===");
      console.log("Dati inviati:", userData);

      // Chiamata API per la registrazione
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log("Risposta registrazione:", data);

       // Gestisce gli errori di registrazione con messaggi specifici
      if (!response.ok) {
        if (
          response.status === 409 ||
          (data.error &&
            data.error.toLowerCase().includes("email") &&
            !data.error.toLowerCase().includes("studente"))
        ) {
          // Errore specifico per email genitore già esistente
          setErrors((prev) => ({
            ...prev,
            email: "Questa email è già registrata",
          }));
        } else if (
          response.status === 400 &&
          data.error &&
          data.error.toLowerCase().includes("studente non trovato")
        ) {
          // Errore specifico per email studente non trovata
          setErrors((prev) => ({
            ...prev,
            email_studente: "Email studente non trovata.",
          }));
        } else {
          // Altri errori generici
          setErrors((prev) => ({
            ...prev,
            submit: data.error || "Errore durante la registrazione",
          }));
        }
        return;
      }
      //Gestione token e auto-login dopo la registrazione
      if (data.token) {
        console.log("Token ricevuto, salvando nel localStorage...");

        // Salva token e ruolo nel localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("ruolo", data.ruolo);

        console.log("Token salvato:", data.token);
        console.log("Ruolo salvato:", data.ruolo);

        // REINDIRIZZAMENTO BASATO SUL RUOLO
        if (data.ruolo === "S") {
          console.log("Reindirizzamento a dashboard studente");
          navigate("/home-studente");
        } else if (data.ruolo === "E") {
          console.log("Reindirizzamento a dashboard educatore");
          navigate("/home-educatore");
        } else if (data.ruolo === "G") {
          console.log("Reindirizzamento a dashboard famiglia");
          navigate("/home-famiglia");
        } else {
          console.log("Ruolo non riconosciuto, reindirizzamento al login");
          navigate("/login");
        }
      } else {
        //FALLBACK:Se non viene restituito un token, reindirizza al login
        console.log("Nessun token ricevuto, reindirizzamento al login");
        alert("Registrazione completata! Effettua il login per continuare.");
        navigate("/login");
      }
    } catch (error) {
       // Gestisce errori di rete o altri errori imprevisti
      console.error("Errore durante la registrazione:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error.message,
      }));
    }
  };

  // Gestisce la validazione in tempo reale della conferma password
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };
    //Renderizzazione del componente
  return (
    <div className={styles["register-section"]}>
      <div className={styles["form-container"]}>
        <p className={styles["form-title"]}>Registrazione</p>
        <form onSubmit={handleSubmit}>
          <div className={styles["form-grid"]}>
            {tipoUtente !== "genitore" && (
              <div>
                <label className={styles["input-label"]} htmlFor="nome"></label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  className={styles["custom-input"]}
                  required={tipoUtente !== "genitore"}
                />
              </div>
            )}
            <div>
              <label
                className={styles["input-label"]}
                htmlFor="cognome"
              ></label>
              <input
                id="cognome"
                type="text"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                placeholder="Cognome"
                className={styles["custom-input"]}
                required
              />
            </div>
            <div className={styles["full-width"]}>
              <label
                className={styles["input-label"]}
                htmlFor="tipoUtente"
              ></label>
              {/* Lista a cascaata per selezionare il tipo di utente */}
              <select
                id="tipoUtente"
                value={tipoUtente}
                onChange={(e) => setTipoUtente(e.target.value)}
                className={styles["custom-select"]}
                required
              >
                <option value="">Seleziona il tuo Ruolo</option>
                <option value="studente">Studente</option>
                <option value="educatore">Educatore</option>
                <option value="genitore">Genitore</option>
              </select>
            </div>
          </div>
          {/* sezioni aggiuntive per lo studente*/}
          {tipoUtente === "studente" && (
            <div className={styles["additional-fields"]}>
              <div className={styles["form-grid"]}>
                <div>
                  <label
                    className={styles["input-label"]}
                    htmlFor="istituto"
                  ></label>
                  <input
                    id="istituto"
                    type="text"
                    value={istituto}
                    onChange={(e) => setIstituto(e.target.value)}
                    placeholder="Istituto"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
                <div>
                  <label
                    className={styles["input-label"]}
                    htmlFor="classe"
                  ></label>
                  {/* Lista a cascaata per selezionare la classe frequentante*/}
                  <select
                    id="classe"
                    value={classe}
                    onChange={(e) => setClasse(e.target.value)}
                    placeholder="Classe"
                    className={styles["custom-input"]}
                    required
                  >
                    <option value="">Seleziona classe</option>
                    <option value="1">Prima</option>
                    <option value="2">Seconda</option>
                    <option value="3">Terza</option>
                    <option value="4">Quarta</option>
                    <option value="5">Quinta</option>
                  </select>
                </div>
                <div>
                  <label
                    className={styles["input-label"]}
                    htmlFor="anno_scolastico"
                  ></label>
                  <input
                    id="anno_scolastico"
                    type="text"
                    value={annoScolastico}
                    onChange={(e) => setAnnoScolastico(e.target.value)}
                    placeholder="Anno Scolastico"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
              </div>
            </div>
          )}
          {/* sezioni aggiuntive per l'educatore */}
          {tipoUtente === "educatore" && (
            <div className={styles["additional-fields"]}>
              <label
                className={styles["input-label"]}
                htmlFor="istituto"
              ></label>
              <input
                id="istituto"
                type="text"
                value={istituto}
                onChange={(e) => setIstituto(e.target.value)}
                placeholder="Istituto"
                className={styles["custom-input"]}
                required
              />
            </div>
          )}
          {/* sezioni aggiuntive per il genitore */}
          {tipoUtente === "genitore" && (
            <div
              className={styles["additional-fields"]}
              style={{ display: "flex", flexDirection: "row", gap: "16px" }}
            >
              <div style={{ flex: 1 }}>
                <label
                  className={styles["input-label"]}
                  htmlFor="numero_telefono"
                ></label>
                <input
                  id="numero_telefono"
                  type="tel"
                  pattern="[0-9]*"
                  maxLength="10"
                  value={numero_telefono}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setnumero_telefono(value);
                  }}
                  placeholder="telefono (solo numeri)"
                  className={styles["custom-input"]}
                  required
                />
              </div>
              <div style={{ width: "15px" }}></div>
              <div style={{ flex: 1 }}>
                <input
                  id="email_studente"
                  type="email"
                  value={email_studente}
                  onChange={(e) => {
                    setemail_studente(e.target.value);
                    // Pulisci l'errore email_studente quando l'utente digita
                    if (errors.email_studente) {
                      setErrors((prev) => ({ ...prev, email_studente: "" }));
                    }
                  }}
                  placeholder="Email Studente"
                  className={`${styles["custom-input"]} ${
                    styles["student-email-input"]
                  } ${errors.email_studente ? styles["input-error"] : ""}`}
                  required
                />
                {/* Messaggio di errore specifico per email studente */}
                {errors.email_studente && (
                  <div className={styles["error-message"]}>
                    {errors.email_studente}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles["form-grid"]}>
            <div>
              <label className={styles["input-label"]} htmlFor="email"></label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Pulisci l'errore email quando l'utente digita
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="Email"
                className={`${styles["custom-input"]} ${
                  errors.email ? styles["input-error"] : ""
                }`}
                required
              />
              {/* Messaggio di errore specifico per email */}
              {errors.email && (
                <div className={styles["error-message"]}>{errors.email}</div>
              )}
            </div>
            <div></div>
          </div>

          <div className={styles["password-grid"]}>
            <div>
              <label
                className={styles["input-label"]}
                htmlFor="password"
              ></label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={styles["custom-input"]}
                required
              />
            </div>
            <div>
              <label
                className={styles["input-label"]}
                htmlFor="confirmPassword"
              ></label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Conferma Password"
                className={`${styles["custom-input"]} ${
                  errors.confirmPassword ? styles["input-error"] : ""
                }`}
                required
              />
              {/* Messaggio di errore specifico per la password */}
              {errors.confirmPassword && (
                <div className={styles["error-message"]}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          {/*MOSTRA ERRORI DI SUBMIT */}
          {errors.submit && (
            <div
              className={styles["error-message"]}
              style={{ marginBottom: "1rem", textAlign: "center" }}
            >
              {errors.submit}
            </div>
          )}

          <button type="submit" className={styles["submit-button"]}>
            Crea Account
          </button>

          <div className={styles["separator"]}>
            <hr className={styles["line"]} />
            <span className={styles["or-text"]}>o</span>
            <hr className={styles["line"]} />
          </div>

          <p className={styles["login-text"]}>
            Hai già un account?{" "}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              className={styles["login-link"]}
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
