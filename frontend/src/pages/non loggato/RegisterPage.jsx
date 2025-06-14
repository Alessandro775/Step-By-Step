import React, { useState } from "react";
import styles from "./RegisterPage.module.css";
import { useNavigate } from "react-router-dom";

// const BASE_URL = import.meta.env.VITE_BASE_URL || "http://172.29.0.201:3000";
const BASE_URL ="http://localhost:3000";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState(""); // Era firstName
  const [cognome, setCognome] = useState(""); // Era lastName
  const [tipoUtente, setTipoUtente] = useState(""); // Era userType
  const [istituto, setIstituto] = useState(""); // Era institute
  const [classe, setClasse] = useState(""); // Era classYear
  const [annoScolastico, setAnnoScolastico] = useState(""); // Era academicYear
  const [telefono, setTelefono] = useState(""); // Era phone
  const [emailStudente, setEmailStudente] = useState(""); // Era studentEmail
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();


  const validatePasswords = () => {
    const newErrors = {};
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Le password non corrispondono";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(BASE_URL);
    if (!validatePasswords()) {
      return;
    }

    try {
    const userData = {
      nome,
      cognome,
      email,
      password,
      ruolo: tipoUtente === "studente" ? "S" : tipoUtente === "educatore" ? "E" : "G",
      ...(tipoUtente === "studente" && { 
        istituto, 
        classe: parseInt(classe), 
        anno_scolastico: parseInt(annoScolastico) 
      }),
      ...(tipoUtente === "educatore" && { istituto }),
      ...(tipoUtente === "genitore" && { telefono, emailStudente }),
    };
      const response = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la registrazione');
      }

      // Reindirizza alla home in caso di successo
      navigate('/home');
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  return (
    <div className={styles["register-section"]}>
      <div className={styles["form-container"]}>
        <p className={styles["form-title"]}>Registrazione</p>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className={styles["form-grid"]}>
            <div>
              <label className={styles["input-label"]} htmlFor="nome">
              </label>
              <input
  id="nome"
  type="text"
  value={nome} // Era firstName
  onChange={(e) => setNome(e.target.value)} // Era setFirstName
  placeholder="Nome"
  className={styles["custom-input"]}
  required
/>
            </div>
            <div>
              <label className={styles["input-label"]} htmlFor="cognome">
              </label>
              <input
  id="cognome"
  type="text"
  value={cognome} // Era nome
  onChange={(e) => setCognome(e.target.value)} // Era setLastName
  placeholder="Cognome"
  className={styles["custom-input"]}
  required
/>
            </div>
            <div className={styles["full-width"]}>
              <label className={styles["input-label"]} htmlFor="tipoUtente">
              </label>
              <select
  id="tipoUtente"
  value={tipoUtente} // Era userType
  onChange={(e) => setTipoUtente(e.target.value)} // Era setUserType
  className={styles["custom-select"]}
  required
>
                <option value="">Seleziona il tuo Ruolo</option>
  <option value="studente">Studente</option> // Era "student"
  <option value="educatore">Educatore</option> // Era "educator"
  <option value="genitore">Genitore</option> // Era "family"
</select>
            </div>
          </div>

          {tipoUtente === "studente" && (
            <div className={styles["additional-fields"]}>
              <div className={styles["form-grid"]}>
                <div>
                  <label className={styles["input-label"]} htmlFor="istituto">
                  </label>
                  <input
                    id="istituto"
                    type="text"
                    value={istituto}
                    onChange={(e) => setIstituto(e.target.value)}
                    placeholder="Instituto"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
                <div>
                  <label className={styles["input-label"]} htmlFor="anno_scolastico">
                  </label>
                  <input
                    id="anno_scolastico"
                    type="text"
                    value={annoScolastico}
                    onChange={(e) => setAnnoScolastico(e.target.value)}
                    placeholder="Classe"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
                {/*<div>
                  <label className={styles["input-label"]} htmlFor="academicYear">
                  </label>
                  <input
                    id="academicYear"
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="Anno Accademico"
                    className={styles["custom-input"]}
                    required
                  />
                </div>*/}
              </div>
            </div>
          )}

          {tipoUtente === "educatore" && (
            <div className={styles["additional-fields"]}>
              <label className={styles["input-label"]} htmlFor="istituto">
              </label>
              <input
                id="istituto"
                type="text"
                value={istituto}
                onChange={(e) => setIstituto(e.target.value)}
                placeholder="Instituto"
                className={styles["custom-input"]}
                required
              />
            </div>
          )}

          {tipoUtente === "genitore" && (
            <div className={styles["additional-fields"]} style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label className={styles["input-label"]} htmlFor="telefono">
                </label>
                <input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Telefono"
                  className={styles["custom-input"]}
                  pattern="[+0-9\s]{10,15}"
                  required
                />
              </div>
              <div style={{ width: "15px" }}></div>
              <div style={{ flex: 1 }}>
                <input
                  id="emailStudente"
                  type="email"
                  value={emailStudente}
                  onChange={(e) => setEmailStudente(e.target.value)}
                  placeholder="Email Studente"
                  className={`${styles["custom-input"]} ${styles["student-email-input"]}`}
                  required
                />
              </div>
            </div>
          )}

          <div className={styles["form-grid"]}>
            <div>
              <label className={styles["input-label"]} htmlFor="email">
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={styles["custom-input"]}
                required
              />
            </div>
            <div></div>
          </div>

          <div className={styles["password-grid"]}>
            <div>
              <label className={styles["input-label"]} htmlFor="password">
              </label>
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
              <label className={styles["input-label"]} htmlFor="confirmPassword">
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Conferma Password"
                className={`${styles["custom-input"]} ${errors.confirmPassword ? styles["input-error"] : ""}`}
                required
              />
              {errors.confirmPassword && (
                <div className={styles["error-message"]}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

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
