// componenti/educatore/ContenutoStudente/FormAggiungiContenuto.jsx
import React from "react";
import styles from "./FormAggiungiContenuto.module.css";

const FormAggiungiContenuto = ({
  //dati e stati del from
  formData,
  esercizi,
  submitting,
  onFormChange,
  onSubmit,
  onCancel,
  uploadProps,
  loadingEsercizi = false // Aggiungi prop per loading esercizi
}) => {
  const {
    selectedFile, //file selezionato dall'utente
    uploadingImage, //stato di upload in corso
    previewUrl, //url per anteprima immagine
    handleFileSelect, //selezione file
    uploadImage, //funzione per avere upload
    resetUpload //funzione per resettare upload
  } = uploadProps;

  // Debug dettagliato
  console.log("🎯 FormAggiungiContenuto - Debug completo:", {
    esercizi,
    numeroEsercizi: esercizi?.length || 0,
    primoEsercizio: esercizi?.[0],
    loadingEsercizi,
    submitting
  });

  return (
    <div className={styles.overlay}>
      {/* Container principale del form */}
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h2>Aggiungi Nuovo Contenuto</h2>
          {/* Pulsante di chiusura */}
          <button
            type="button"
            onClick={onCancel}
            className={styles.closeButton}
            disabled={submitting}// Disabilitato durante l'invio
          >
            ✕
          </button>
        </div>
{/*campo testo esercizio*/}
        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="testo" className={styles.label}>
              Testo dell'esercizio *
            </label>
            <input
              type="text"
              id="testo"
              name="testo"
              value={formData.testo}
              onChange={onFormChange}
              placeholder="Inserisci il testo che lo studente deve pronunciare"
              className={styles.input}
              disabled={submitting}// Disabilitato durante l'invio
              required // Campo obbligatorio
            />
          </div>
{/*SELEZIONE TIPO ESERCIZIO*/}
          <div className={styles.formGroup}>
            <label htmlFor="idEsercizio" className={styles.label}>
              Tipo di Esercizio *
            </label>
            <select
              id="idEsercizio"
              name="idEsercizio"
              value={formData.idEsercizio}
              onChange={onFormChange}
              className={styles.select}
              disabled={submitting || loadingEsercizi} // Disabilitato durante invio o caricamento
              required // Campo obbligatorio
            >
              <option value="">
                {loadingEsercizi 
                  ? "Caricamento tipi esercizi..." 
                  : esercizi.length === 0 
                    ? "Nessun tipo di esercizio disponibile"
                    : "Seleziona un tipo di esercizio"
                }
              </option>
              {esercizi.map((esercizio) => {
                // Debug per ogni esercizio
                console.log("📝 Rendering option per esercizio:", esercizio);
                
                // gestisci diversi formati di dati
                const id = esercizio.id || esercizio.idEsercizio;
                const nome = esercizio.titolo || esercizio.nome || esercizio.tipologia || `Esercizio ${id}`;
                
                return (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                );
              })}
            </select>
          </div>
{/*SEZIONE UPLOAD IMMAGINE*/}
          <div className={styles.formGroup}>
            <label className={styles.label}>Immagine (opzionale)</label>
            {/* Container per controlli upload */}
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="fileInput"
                disabled={submitting || uploadingImage}
              />
              <label htmlFor="fileInput" className={styles.fileLabel}>
                📁 Scegli Immagine
              </label>
              
              {selectedFile && (
                <div className={styles.selectedFile}>
                  <span>📎 {selectedFile.name}</span>
                   {/* Pulsante per rimuovere file selezionato */}
                  <button
                    type="button"
                    onClick={resetUpload}
                    className={styles.removeFile}
                    disabled={submitting || uploadingImage}
                  >
                    ✕
                  </button>
                </div>
              )}
              {/*pulsante upload, Mostrato solo se c'è un file selezionato ma non ancora caricato*/}
              {selectedFile && !formData.immagine && (
                <button
                  type="button"
                  onClick={uploadImage}
                  className={styles.uploadButton}
                  disabled={submitting || uploadingImage}
                >
                  {uploadingImage ? "Caricamento..." : "📤 Carica Immagine"}
                </button>
              )}
            </div>
{/* ANTEPRIMA IMMAGINE*/}
            {previewUrl && (
              <div className={styles.preview}>
                <img
                  src={previewUrl}
                  alt="Anteprima"
                  className={styles.previewImage}
                />
              </div>
            )}
{/*MESSAGGIO SUCCESSO UPLOAD*/}
            {formData.immagine && (
              <div className={styles.success}>
                ✅ Immagine caricata con successo!
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {/* Pulsante Annulla */}
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || loadingEsercizi || !formData.testo || !formData.idEsercizio}
            >
              {submitting ? "Aggiungendo..." : "Aggiungi Contenuto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormAggiungiContenuto;
