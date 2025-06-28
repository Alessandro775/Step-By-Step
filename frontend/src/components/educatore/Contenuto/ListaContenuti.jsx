// componenti/educatore/ContenutoStudente/ListaContenuti.jsx
import React from "react";
import { formattatoreDate } from "../../../servizi/utilità/utilitaFormattaData.js";
import styles from "./ListaContenuti.module.css";

const ListaContenuti = ({ contenuti, onRiassegna, onElimina }) => {
  console.log("📋 ListaContenuti - Props ricevute:", {
    contenuti: contenuti?.length || 0,
    onRiassegna: typeof onRiassegna,
    onElimina: typeof onElimina
  });

  if (contenuti.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3>Nessun contenuto assegnato</h3>
        <p>Inizia aggiungendo il primo contenuto per questo studente</p>
      </div>
    );
  }

  const handleRiassegna = (idEsercizioAssegnato, titolo) => {
    console.log("🔄 Button Riassegna clicked:", { idEsercizioAssegnato, titolo });
    if (onRiassegna) {
      onRiassegna(idEsercizioAssegnato, titolo);
    } else {
      console.error("❌ onRiassegna function not provided");
    }
  };

  const handleElimina = (idEsercizioAssegnato, titolo) => {
    console.log("🗑️ Button Elimina clicked:", { idEsercizioAssegnato, titolo });
    if (onElimina) {
      onElimina(idEsercizioAssegnato, titolo);
    } else {
      console.error("❌ onElimina function not provided");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Contenuti Assegnati ({contenuti.length})</h2>
      
      <div className={styles.grid}>
        {contenuti.map((contenuto) => {
          console.log("📄 Rendering contenuto:", contenuto);
          
          return (
            <div key={contenuto.idEsercizioAssegnato} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.headerContent}>
                  <h3 className={styles.cardTitle}>
                    {contenuto.titolo || contenuto.testo || "Senza titolo"}
                  </h3>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRiassegna(
                        contenuto.idEsercizioAssegnato, 
                        contenuto.titolo || contenuto.testo
                      );
                    }}
                    className={styles.actionButton}
                    title="Riassegna esercizio"
                    type="button"
                  >
                    🔄
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleElimina(
                        contenuto.idEsercizioAssegnato, 
                        contenuto.titolo || contenuto.testo
                      );
                    }}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Elimina contenuto"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                {contenuto.immagine && (
                  <div className={styles.imageContainer}>
                    <img
                      src={contenuto.immagine}
                      alt={contenuto.titolo || contenuto.testo}
                      className={styles.image}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className={styles.metadata}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>📅 Assegnato:</span>
                    <span className={styles.metaValue}>
                      {formattatoreDate.formatDateItalian(
                        contenuto.data_inizio || contenuto.dataAssegnazione
                      )}
                    </span>
                    {formattatoreDate.isAssegnatoOggi(
                      contenuto.data_inizio || contenuto.dataAssegnazione
                    ) && (
                      <span className={styles.badge}>Oggi</span>
                    )}
                  </div>

                  

                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>📋 Stato:</span>
                    <span className={`${styles.status} ${
                      contenuto.completato ? styles.completed : styles.pending
                    }`}>
                      {contenuto.completato ? "✅ Completato" : "⏳ In attesa"}
                    </span>
                  </div>

                  {contenuto.tipologia && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>🎯 Tipo Esercizio:</span>
                      <span className={styles.tipoEsercizio}>
                        {contenuto.tipologia}
                      </span>
                    </div>
                  )}
                  
                  {contenuto.descrizione && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>📖 Descrizione:</span>
                      <span className={styles.descrizioneValue}>
                        {contenuto.descrizione}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaContenuti;
