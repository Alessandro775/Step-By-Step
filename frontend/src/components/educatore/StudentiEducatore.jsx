import React, { useState, useEffect } from "react";
import styles from "./StudentiEducatore.module.css";

const StudentiEducatore = () => {
  // Stati per gestire le viste
  const [currentView, setCurrentView] = useState("studenti"); // "studenti", "contenuti", "cronologia"
  const [selectedStudente, setSelectedStudente] = useState(null);
  
  // Stati esistenti
  const [studenti, setStudenti] = useState([]);
  const [emailNuovoStudente, setEmailNuovoStudente] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Funzioni per gestire le viste
  const handleVisualizzaContenuti = (idStudente, nomeStudente) => {
    setSelectedStudente({
      id: idStudente,
      nome: nomeStudente
    });
    setCurrentView("contenuti");
  };

  const handleVisualizzaCronologia = (idStudente, nomeStudente) => {
    setSelectedStudente({
      id: idStudente,
      nome: nomeStudente
    });
    setCurrentView("cronologia");
  };

  const handleBackToStudenti = () => {
    setCurrentView("studenti");
    setSelectedStudente(null);
  };

  useEffect(() => {
    // Debug iniziale del token
    const token = localStorage.getItem("token");
    console.log("=== DEBUG TOKEN ===");
    console.log("Token presente:", !!token);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Payload token:", payload);
        console.log("ID utente:", payload.id);
        console.log("Ruolo utente:", payload.ruolo);

        if (payload.ruolo !== "E") {
          setError(
            "Accesso negato: solo gli educatori possono gestire gli studenti"
          );
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Errore decodifica token:", e);
        setError("Token non valido. Effettua nuovamente il login.");
        setLoading(false);
        return;
      }
    } else {
      setError("Token non presente. Effettua il login.");
      setLoading(false);
      return;
    }

    fetchStudenti();
  }, []);

  const fetchStudenti = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Token non presente. Effettua il login.");
        return;
      }

      console.log("=== FETCH STUDENTI ===");
      console.log("Chiamata API in corso...");

      const response = await fetch("http://localhost:3000/api/studenti", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Status response:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Errore response:", response.status, errorText);

        if (response.status === 401) {
          setError("Sessione scaduta. Effettua nuovamente il login.");
        } else if (response.status === 403) {
          setError(
            "Accesso negato. Solo gli educatori possono vedere gli studenti."
          );
        } else {
          setError(`Errore del server: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      console.log("Dati ricevuti dal server:", data);
      console.log("Tipo di dati:", typeof data);
      console.log("È un array?", Array.isArray(data));
      console.log("Numero di studenti:", data.length);

      if (!Array.isArray(data)) {
        throw new Error("Formato dati non valido: atteso array");
      }

      if (data.length > 0) {
        console.log("Struttura primo studente:", Object.keys(data[0]));
        console.log("Primo studente completo:", data[0]);
      }

      setStudenti(data);
      setError(null);
      console.log("Studenti caricati correttamente");
    } catch (err) {
      console.error("Errore fetch studenti:", err);
      setError("Errore nel caricamento degli studenti: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAggiungiStudente = async (e) => {
    e.preventDefault();

    if (!emailNuovoStudente.trim()) {
      setError("Inserisci un'email valida");
      return;
    }

    try {
      setAdding(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      console.log("=== AGGIUNTA STUDENTE ===");
      console.log("Email da aggiungere:", emailNuovoStudente);

      const response = await fetch("http://localhost:3000/api/studenti", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailNuovoStudente.trim() }),
      });

      console.log("Status aggiunta:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore aggiunta:", errorData);
        throw new Error(
          errorData.error || "Errore nell'aggiunta dello studente"
        );
      }

      const result = await response.json();
      console.log("Risultato aggiunta:", result);

      setEmailNuovoStudente("");
      setSuccess("Studente aggiunto con successo!");

      await fetchStudenti();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Errore aggiunta studente:", err);
      setError("Errore nell'aggiunta dello studente: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleEliminaStudente = async (idStudente, nomeStudente) => {
    const conferma = window.confirm(
      `Sei sicuro di voler rimuovere ${nomeStudente} dalla tua lista studenti?`
    );

    if (!conferma) return;

    try {
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      console.log("=== ELIMINAZIONE STUDENTE ===");
      console.log("ID studente da eliminare:", idStudente);

      const response = await fetch(
        `http://localhost:3000/api/studenti/${idStudente}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Status eliminazione:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore eliminazione:", errorData);
        throw new Error(
          errorData.error || "Errore nella rimozione dello studente"
        );
      }

      const result = await response.json();
      console.log("Risultato eliminazione:", result);

      setSuccess("Studente rimosso con successo!");

      await fetchStudenti();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Errore eliminazione studente:", err);
      setError("Errore nella rimozione dello studente: " + err.message);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Rendering condizionale basato sulla vista corrente
  return (
    <div className={styles.container}>
      {currentView === "studenti" ? (
        // Vista principale studenti
        <>
          <div className={styles.header}>
            <h2>Gestione Studenti</h2>
            <p>Qui puoi gestire gli studenti assegnati al tuo account educatore</p>
          </div>

          {/* Form aggiunta studente */}
          <div className={styles.formSection}>
            <h3>Aggiungi Nuovo Studente</h3>
            <form onSubmit={handleAggiungiStudente} className={styles.form}>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder="Email dello studente"
                  value={emailNuovoStudente}
                  onChange={(e) => setEmailNuovoStudente(e.target.value)}
                  required
                  disabled={adding}
                  className={styles.emailInput}
                />
                <button
                  type="submit"
                  disabled={adding}
                  className={styles.addButton}
                >
                  {adding ? "Aggiungendo..." : "Aggiungi Studente"}
                </button>
              </div>
            </form>
          </div>

          {/* Messaggi di stato */}
          {(error || success) && (
            <div className={styles.messagesSection}>
              {error && (
                <div className={styles.error}>
                  <span>{error}</span>
                  <button onClick={clearMessages} className={styles.closeButton}>
                    ×
                  </button>
                </div>
              )}
              {success && (
                <div className={styles.success}>
                  <span>{success}</span>
                  <button onClick={clearMessages} className={styles.closeButton}>
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Caricamento studenti...</span>
            </div>
          )}

          {/* Lista studenti */}
          {!loading && (
            <div className={styles.studentsSection}>
              <h3>I Tuoi Studenti ({studenti.length})</h3>

              {studenti.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nessuno studente associato al momento</p>
                  <p>Aggiungi studenti utilizzando il form sopra</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
                        <th>Data Assegnazione</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studenti.map((studente) => (
                        <tr key={studente.idStudente}>
                          <td>{studente.nome || "N/D"}</td>
                          <td>{studente.cognome || "N/D"}</td>
                          <td>{studente.email}</td>
                          <td>
                            {studente.data_assegnazione
                              ? new Date(
                                  studente.data_assegnazione
                                ).toLocaleDateString("it-IT")
                              : "N/D"}
                          </td>
                          <td className={styles.actionsCell}>
                            <div className={styles.buttonGroup}>
                              <button
                                className={styles.viewButton}
                                onClick={() => handleVisualizzaContenuti(
                                  studente.idStudente,
                                  `${studente.nome} ${studente.cognome}`
                                )}
                                title="Visualizza contenuti assegnati"
                              >
                                Contenuti
                              </button>

                              <button
                                className={styles.historyButton}
                                onClick={() => handleVisualizzaCronologia(
                                  studente.idStudente,
                                  `${studente.nome} ${studente.cognome}`
                                )}
                                title="Visualizza cronologia studente"
                              >
                                Cronologia
                              </button>

                              <button
                                className={styles.deleteButton}
                                onClick={() => handleEliminaStudente(
                                  studente.idStudente,
                                  `${studente.nome} ${studente.cognome}`
                                )}
                                title="Rimuovi studente"
                              >
                                Rimuovi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Debug info (rimuovi in produzione) */}
          {process.env.NODE_ENV === "development" && (
            <div className={styles.debugInfo}>
              <details>
                <summary>Debug Info</summary>
                <pre>
                  {JSON.stringify(
                    {
                      studentiCount: studenti.length,
                      loading,
                      adding,
                      hasError: !!error,
                      hasSuccess: !!success,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}
        </>
      ) : currentView === "contenuti" ? (
        // Vista contenuti studente
        <ContenutoStudenteWrapper 
          idStudente={selectedStudente.id} 
          nomeStudente={selectedStudente.nome}
          onBack={handleBackToStudenti}
        />
      ) : (
        // Vista cronologia studente
        <CronologiaStudenteWrapper 
          idStudente={selectedStudente.id} 
          nomeStudente={selectedStudente.nome}
          onBack={handleBackToStudenti}
        />
      )}
    </div>
  );
};

// Componente wrapper per i contenuti
const ContenutoStudenteWrapper = ({ idStudente, nomeStudente, onBack }) => {
  const [contenuti, setContenuti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContenuti();
  }, [idStudente]);

  const fetchContenuti = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/contenuti`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento dei contenuti');
      }

      const data = await response.json();
      setContenuti(data);
      
    } catch (err) {
      setError('Errore nel caricamento dei contenuti: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Caricamento contenuti...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Torna ai Studenti
        </button>
        <h2>Contenuti Assegnati</h2>
        <p>Studente: <strong>{nomeStudente}</strong></p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.contentSection}>
        {contenuti.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nessun contenuto assegnato a questo studente</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Descrizione</th>
                  <th>Data Inizio</th>
                  <th>Scadenza</th>
                  <th>Completato</th>
                </tr>
              </thead>
              <tbody>
                {contenuti.map((contenuto) => (
                  <tr key={contenuto.idContenuto}>
                    <td>{contenuto.titolo}</td>
                    <td>{contenuto.descrizione}</td>
                    <td>
                      {contenuto.data_inizio 
                        ? new Date(contenuto.data_inizio).toLocaleDateString('it-IT')
                        : 'N/D'
                      }
                    </td>
                    <td>
                      {contenuto.data_scadenza 
                        ? new Date(contenuto.data_scadenza).toLocaleDateString('it-IT')
                        : 'N/D'
                      }
                    </td>
                    <td>
                      <span className={contenuto.completato ? styles.completed : styles.pending}>
                        {contenuto.completato ? 'Sì' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente wrapper per la cronologia
const CronologiaStudenteWrapper = ({ idStudente, nomeStudente, onBack }) => {
  const [cronologia, setCronologia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCronologia();
  }, [idStudente]);

  const fetchCronologia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/cronologia`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento della cronologia');
      }

      const data = await response.json();
      setCronologia(data);
      
    } catch (err) {
      setError('Errore nel caricamento della cronologia: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Caricamento cronologia...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Torna ai Studenti
        </button>
        <h2>Cronologia Attività</h2>
        <p>Studente: <strong>{nomeStudente}</strong></p>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.contentSection}>
        {cronologia.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nessuna attività registrata per questo studente</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Esercizio</th>
                  <th>Punteggio</th>
                  <th>Tempo Impiegato</th>
                  <th>Data Completamento</th>
                  <th>Tentativi</th>
                </tr>
              </thead>
              <tbody>
                {cronologia.map((record, index) => (
                  <tr key={index}>
                    <td>{record.titolo || 'N/D'}</td>
                    <td>{record.punteggio || 'N/D'}</td>
                    <td>{record.tempo_impiegato || 'N/D'}</td>
                    <td>
                      {record.data_completamento 
                        ? new Date(record.data_completamento).toLocaleString('it-IT')
                        : 'N/D'
                      }
                    </td>
                    <td>{record.tentativi || 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentiEducatore;