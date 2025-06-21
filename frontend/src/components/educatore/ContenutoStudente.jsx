import React, { useState, useEffect } from "react";
import styles from "./ContenutoStudente.module.css";

const ContenutoStudente = () => {
  const [contenuti, setContenuti] = useState([]);
  const [studenteInfo, setStudenteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [esercizi, setEsercizi] = useState([]);
  const [formData, setFormData] = useState({
    testo: "",
    immagine: "",
    idEsercizio: "",
  });

  // Aggiungi questa funzione nel componente ContenutoStudente
  const formatDateItalian = (dateString) => {
    if (!dateString) return "";

    try {
      const mesiItaliani = [
        "gennaio",
        "febbraio",
        "marzo",
        "aprile",
        "maggio",
        "giugno",
        "luglio",
        "agosto",
        "settembre",
        "ottobre",
        "novembre",
        "dicembre",
      ];

      const date = new Date(dateString);

      // Verifica che la data sia valida
      if (isNaN(date.getTime())) {
        return dateString; // Ritorna la stringa originale se non è una data valida
      }

      const giorno = date.getDate();
      const mese = mesiItaliani[date.getMonth()];
      const anno = date.getFullYear();

      return `${giorno} ${mese} ${anno}`;
    } catch (error) {
      console.error("Errore formattazione data:", error);
      return dateString;
    }
  };

  const [submitting, setSubmitting] = useState(false);

  // Stati per upload immagine
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const studenteData = sessionStorage.getItem("studenteSelezionato");
    if (studenteData) {
      const parsedData = JSON.parse(studenteData);
      setStudenteInfo(parsedData);
      fetchContenuti(parsedData.id);
    } else {
      setError("Informazioni studente non trovate");
      setLoading(false);
    }
    fetchEsercizi();
  }, []);

  const fetchContenuti = async (idStudente) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      console.log("=== FETCH CONTENUTI DEBUG ===");
      console.log("ID Studente:", idStudente);

      const response = await fetch(
        `http://localhost:3000/api/studenti/${idStudente}/contenuti`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Errore nel caricamento dei contenuti"
        );
      }

      const data = await response.json();
      console.log("Contenuti ricevuti:", data);

      // DEBUG: Verifica duplicati
      const ids = data.map((c) => c.idEsercizioAssegnato);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn("⚠️ ID duplicati trovati:", duplicateIds);
        console.log("Dati completi:", data);
      }

      // DEBUG: Verifica struttura dati
      data.forEach((contenuto, index) => {
        console.log(`Contenuto ${index}:`, {
          id: contenuto.idEsercizioAssegnato,
          testo: contenuto.testo || contenuto.titolo,
          tipologia: contenuto.tipologia,
          data: contenuto.data_assegnazione || contenuto.data_inizio,
        });
      });

      setContenuti(data);
    } catch (err) {
      console.error("Errore fetch contenuti:", err);
      setError("Errore nel caricamento dei contenuti: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEsercizi = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/api/esercizi", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEsercizi(data);
      }
    } catch (err) {
      console.error("Errore caricamento esercizi:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setError("Seleziona prima un'immagine");
      return;
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem("token");
      const uploadFormData = new FormData();
      uploadFormData.append("image", selectedFile);

      console.log("Caricando immagine:", selectedFile.name);

      const response = await fetch("http://localhost:3000/api/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore upload immagine");
      }

      const data = await response.json();
      console.log("Risposta upload:", data);

      setFormData((prev) => ({
        ...prev,
        immagine: data.imageUrl,
      }));

      setError(null);
      alert("Immagine caricata con successo!");
    } catch (err) {
      console.error("Errore upload:", err);
      setError("Errore upload immagine: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRiassegnaEsercizio = async (idEsercizioAssegnato, testo) => {
    const conferma = window.confirm(
      `Sei sicuro di voler riassegnare l'esercizio "${testo}"?\n\nQuesto creerà una nuova copia dell'esercizio per lo studente.`
    );

    if (!conferma) return;

    try {
      const token = localStorage.getItem("token");

      console.log("Riassegnando esercizio:", idEsercizioAssegnato);

      const response = await fetch(
        `http://localhost:3000/api/studenti/${studenteInfo.id}/contenuti/${idEsercizioAssegnato}/riassegna`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Errore nella riassegnazione dell'esercizio"
        );
      }

      const result = await response.json();

      alert(
        `✅ ${result.message}\n\n🔄 Lo studente ora ha una nuova copia dell'esercizio da completare.`
      );

      // Ricarica la lista dei contenuti per mostrare il nuovo esercizio
      await fetchContenuti(studenteInfo.id);
    } catch (err) {
      console.error("Errore riassegnazione:", err);
      setError("Errore nella riassegnazione dell'esercizio: " + err.message);
    }
  };

  const handleSubmitContenuto = async (e) => {
    e.preventDefault();

    if (!formData.testo || !formData.idEsercizio) {
      setError("Compila tutti i campi obbligatori");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      console.log("Inviando dati:", formData);

      const response = await fetch(
        `http://localhost:3000/api/studenti/${studenteInfo.id}/contenuti`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Errore nell'aggiunta del contenuto"
        );
      }

      const result = await response.json();

      // Gestisci messaggio di riassegnazione
      if (result.riassegnazione) {
        alert(
          `✅ ${result.message}\n\n⚠️ Nota: Questo esercizio era già stato assegnato in precedenza. Ora lo studente avrà due versioni dello stesso esercizio.`
        );
      } else {
        alert(`✅ ${result.message}`);
      }

      // Reset form
      setFormData({
        testo: "",
        immagine: "",
        idEsercizio: "",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowForm(false);
      setError(null);
      await fetchContenuti(studenteInfo.id);
    } catch (err) {
      console.error("Errore submit:", err);
      setError("Errore nell'aggiunta del contenuto: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminaContenuto = async (idEsercizioAssegnato, titolo) => {
    const conferma = window.confirm(
      `Sei sicuro di voler eliminare il contenuto "${titolo}"?`
    );

    if (!conferma) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/api/studenti/${studenteInfo.id}/contenuti/${idEsercizioAssegnato}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Errore nell'eliminazione del contenuto"
        );
      }

      await fetchContenuti(studenteInfo.id);
    } catch (err) {
      setError("Errore nell'eliminazione del contenuto: " + err.message);
    }
  };

  const handleTornaIndietro = () => {
    const event = new CustomEvent("backToStudenti");
    window.dispatchEvent(event);
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
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handleTornaIndietro} className={styles.backButton}>
          ← Torna agli Studenti
        </button>
        <h1>
          Contenuti per {studenteInfo?.nome} {studenteInfo?.cognome}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
          disabled={showForm}
        >
          + Aggiungi Contenuto
        </button>
      </div>

      {/* Errori */}
      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Form per aggiungere contenuto */}
      {showForm && (
        <div className={styles.formContainer}>
          <h3>Aggiungi Nuovo Contenuto/Esercizio</h3>
          <form onSubmit={handleSubmitContenuto} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="testo">Testo/Contenuto *</label>
              <input
                type="text"
                id="testo"
                name="testo"
                value={formData.testo}
                onChange={handleFormChange}
                required
                placeholder="Inserisci il testo o il contenuto"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="idEsercizio">Tipo di Esercizio *</label>
              <select
                id="idEsercizio"
                name="idEsercizio"
                value={formData.idEsercizio}
                onChange={handleFormChange}
                required
              >
                <option value="">Seleziona esercizio</option>
                {esercizi.map((esercizio) => (
                  <option
                    key={esercizio.idEsercizio}
                    value={esercizio.idEsercizio}
                  >
                    {esercizio.tipologia} - {esercizio.descrizione}
                  </option>
                ))}
              </select>
            </div>

            {/* Sezione Upload immagine */}
            <div className={styles.formGroup}>
              <label>Immagine</label>

              {/* Upload file */}
              <div className={styles.imageUploadSection}>
                <h4>Carica da computer:</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />

                {previewUrl && (
                  <div className={styles.imagePreview}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxWidth: "200px", maxHeight: "200px" }}
                    />
                  </div>
                )}

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={uploadingImage}
                    className={styles.uploadButton}
                  >
                    {uploadingImage ? "Caricando..." : "Carica Immagine"}
                  </button>
                )}
              </div>

              {/* URL manuale */}
              <div className={styles.urlSection}>
                <h4>Oppure inserisci URL:</h4>
                <input
                  type="url"
                  name="immagine"
                  value={formData.immagine}
                  onChange={handleFormChange}
                  placeholder="https://esempio.com/immagine.jpg"
                  className={styles.urlInput}
                />
              </div>

              {/* Immagine corrente */}
              {formData.immagine && (
                <div className={styles.currentImage}>
                  <h4>Immagine selezionata:</h4>
                  <img
                    src={formData.immagine}
                    alt="Immagine selezionata"
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <p>
                    <small>{formData.immagine}</small>
                  </p>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setFormData({
                    testo: "",
                    immagine: "",
                    idEsercizio: "",
                  });
                }}
                className={styles.cancelButton}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitButton}
              >
                {submitting ? "Aggiungendo..." : "Aggiungi Contenuto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista contenuti */}
      <div className={styles.contenutiGrid}>
        {contenuti.map((contenuto, index) => {
          // Controlla se è stato riassegnato oggi
          const dataAssegnazione = new Date(
            contenuto.data_inizio || contenuto.data_assegnazione
          );
          const oggi = new Date();
          const isRiassegnatoOggi =
            dataAssegnazione.toDateString() === oggi.toDateString();

          return (
            <div
              key={`contenuto-${contenuto.idEsercizioAssegnato}-${index}`}
              className={`${styles.contenutoCard} ${
                isRiassegnatoOggi ? styles.riassegnatoOggi : ""
              }`}
            >
              <div className={styles.contenutoHeader}>
                <h3>📝 {contenuto.testo || contenuto.titolo}</h3>
                <div className={styles.headerBadges}>
                  {isRiassegnatoOggi && (
                    <span
                      className={styles.riassegnatoBadge}
                      title="Assegnato oggi"
                    >
                      Assegnato oggi
                    </span>
                  )}
                  <button
                    onClick={() =>
                      handleEliminaContenuto(
                        contenuto.idEsercizioAssegnato,
                        contenuto.testo || contenuto.titolo
                      )
                    }
                    className={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.contenutoInfo}>
                <p>
                  <strong>🎯 Parola/Contenuto:</strong>
                  <span className={styles.parolaEvidenziata}>
                    {contenuto.testo || contenuto.titolo}
                  </span>
                </p>
                <p>
                  <strong>📚 Tipo Esercizio:</strong> {contenuto.tipologia}
                </p>
                <p>
                  <strong>📝 Descrizione:</strong> {contenuto.descrizione}
                </p>
                <p>
                  <strong>
                    📅 {isRiassegnatoOggi ? "Riassegnato il:" : "Assegnato il:"}
                  </strong>
                  <span
                    className={`${styles.dataAssegnazione} ${
                      isRiassegnatoOggi ? styles.dataRiassegnata : ""
                    }`}
                  >
                    {formatDateItalian(
                      contenuto.data_inizio || contenuto.data_assegnazione
                    )}
                  </span>
                </p>
                <p>
                  <strong>✅ Stato:</strong>
                  <span
                    className={`${styles.statoEsercizio} ${
                      contenuto.completato
                        ? styles.completato
                        : styles.nonCompletato
                    }`}
                  >
                    {contenuto.completato
                      ? "Completato"
                      : isRiassegnatoOggi
                      ? "Da rifare (riassegnato)"
                      : "Da completare"}
                  </span>
                </p>
              </div>

              {/* Sezione Azioni */}
              <div className={styles.azioniEsercizio}>
                <button
                  onClick={() =>
                    handleRiassegnaEsercizio(
                      contenuto.idEsercizioAssegnato,
                      contenuto.testo || contenuto.titolo
                    )
                  }
                  className={styles.riassegnaButton}
                  title="Riassegna questo esercizio allo studente"
                >
                  🔄 Riassegna
                </button>
              </div>

              {contenuto.immagine && (
                <div className={styles.contenutoImage}>
                  <img
                    src={contenuto.immagine}
                    alt={contenuto.testo || contenuto.titolo}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContenutoStudente;
