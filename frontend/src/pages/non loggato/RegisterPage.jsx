import React, { useState } from "react";
import styles from "./RegisterPage.module.css";
import { useNavigate } from "react-router-dom";

// const BASE_URL = import.meta.env.VITE_BASE_URL || "http://172.29.0.201:3000";
const BASE_URL ="http://localhost:3000";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("");
  const [institute, setInstitute] = useState("");
  const [classYear, setClassYear] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [phone, setPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
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
        firstName,
        lastName,
        email,
        password,
        role: userType === "student" ? "S" : userType === "educator" ? "E" : "F",
        ...(userType === "student" && { 
          institute, 
          classYear: parseInt(classYear), 
          academicYear: parseInt(academicYear) 
        }),
        ...(userType === "educator" && { institute }),
        ...(userType === "family" && { phone, studentEmail }),
      };
      console.log(`${BASE_URL}/api/register`);
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
              <label className={styles["input-label"]} htmlFor="firstName">
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nome"
                className={styles["custom-input"]}
                required
              />
            </div>
            <div>
              <label className={styles["input-label"]} htmlFor="lastName">
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Cognome"
                className={styles["custom-input"]}
                required
              />
            </div>
            <div className={styles["full-width"]}>
              <label className={styles["input-label"]} htmlFor="userType">
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={styles["custom-select"]}
                required
              >
                <option value="">Seleziona il tuo Ruolo</option>
                <option value="student">Studente</option>
                <option value="educator">Educatore</option>
                <option value="family">Genitore</option>
              </select>
            </div>
          </div>

          {userType === "student" && (
            <div className={styles["additional-fields"]}>
              <div className={styles["form-grid"]}>
                <div>
                  <label className={styles["input-label"]} htmlFor="institute">
                  </label>
                  <input
                    id="institute"
                    type="text"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    placeholder="Instituto"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
                <div>
                  <label className={styles["input-label"]} htmlFor="classYear">
                  </label>
                  <input
                    id="classYear"
                    type="text"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    placeholder="Classe"
                    className={styles["custom-input"]}
                    required
                  />
                </div>
                <div>
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
                </div>
              </div>
            </div>
          )}

          {userType === "educator" && (
            <div className={styles["additional-fields"]}>
              <label className={styles["input-label"]} htmlFor="institute">
              </label>
              <input
                id="institute"
                type="text"
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                placeholder="Instituto"
                className={styles["custom-input"]}
                required
              />
            </div>
          )}

          {userType === "family" && (
            <div className={styles["additional-fields"]} style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label className={styles["input-label"]} htmlFor="phone">
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefono"
                  className={styles["custom-input"]}
                  pattern="[+0-9\s]{10,15}"
                  required
                />
              </div>
              <div style={{ width: "15px" }}></div>
              <div style={{ flex: 1 }}>
                <input
                  id="studentEmail"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
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
