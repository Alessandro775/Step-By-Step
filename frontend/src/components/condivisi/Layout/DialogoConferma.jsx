import React, { useEffect } from 'react';
import styles from './DialogoConferma.module.css';
//Componente modale per dialoghi di conferma
const DialogoConferma = ({ 
  // Flag per controllare la visibilità del dialogo
  aperto = false,
  // Testi personalizzabili con valori di default
  titolo = "Conferma",
  messaggio = "Sei sicuro?", 
  testoConferma = "Conferma",
  testoAnnulla = "Annulla",
  variante = "default", // "default", "pericolo", "avviso"
  onConferma,
  onAnnulla,
  onChiudi,
  // Stato di caricamento per operazioni asincrone
  caricamento = false
}) => {
// Non gestisce eventi se il dialogo non è aperto
  useEffect(() => {
    const gestisciTasti = (evento) => {
      if (!aperto) return;
      //Escape chiude il dialogo
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onAnnulla();
        //conferma l'azione
      } else if (evento.key === 'Enter') {
        evento.preventDefault();
        onConferma();
      }
    };
// Aggiunge l'evento keydown per gestire tasti
    document.addEventListener('keydown', gestisciTasti);
    return () => document.removeEventListener('keydown', gestisciTasti);
  }, [aperto, onConferma, onAnnulla]); // Gestione eventi tastiera riesegie quando cambiano

  // Blocca scroll del body quando aperto
  useEffect(() => {
    if (aperto) {
      // Blocca lo scroll quando il dialogo è aperto
      document.body.style.overflow = 'hidden';
    } else {
      // Ripristina lo scroll quando il dialogo è chiuso
      document.body.style.overflow = 'unset';
    }
// Cleanup: assicura che lo scroll sia sempre ripristinato
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [aperto]);//riesegue quando cambia lo stato di apertura

  if (!aperto) return null;// Non renderizza nulla se il dialogo non è aperto

  const gestisciClickSfondo = (evento) => {
    // Verifica che il click sia sull'elemento overlay stesso
    if (evento.target === evento.currentTarget) {
      onAnnulla();
    }
  };

  const ottieniIcona = () => {
    switch (variante) {
      case 'pericolo': return '⚠️'; //azioni pericolose
      case 'avviso': return '🔔';//notifiche importanti
      default: return '❓';//conferme gerarchie
    }
  };
//costruisce il css per il dialogo
  const ottieniClasseDialogo = () => {
    return `${styles.dialogo} ${styles[variante]}`;
  };
//costruisce il css per il pulsante di conferma
  const ottieniClassePulsanteConferma = () => {
    return `${styles.pulsante} ${styles.pulsanteConferma} ${styles[`conferma${variante.charAt(0).toUpperCase() + variante.slice(1)}`]}`;
  };

  return (
    // Overlay di sfondo che copre tutta la viewport
    <div className={styles.sovrapposizione} onClick={gestisciClickSfondo}>
      {/* Container principale del dialogo */}
      <div className={ottieniClasseDialogo()}>
        
        {/* Header */}
        <div className={styles.intestazione}>
          <div className={styles.icona}>
            {ottieniIcona()}
          </div>
          <h3 className={styles.titolo}>
            {titolo}
          </h3>
        </div>
        
        {/* Corpo del messaggio */}
        <div className={styles.corpo}>
          <p className={styles.messaggio}>
            {messaggio}
          </p>
        </div>
        
        {/* Footer con pulsanti */}
        <div className={styles.piede}>
          <button 
          // Pulsante annulla
            className={`${styles.pulsante} ${styles.pulsanteAnnulla}`}
            onClick={onAnnulla}
            disabled={caricamento}
            autoFocus={variante !== 'pericolo'}
          >
            {testoAnnulla}
          </button>
          
          <button 
            className={ottieniClassePulsanteConferma()}
            onClick={onConferma}
            disabled={caricamento}
            autoFocus={variante === 'pericolo'}
          >
            {caricamento ? (
              <>
                <span className={styles.spinnerPulsante}></span>
                Attendere...
              </>
            ) : (
              testoConferma
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogoConferma;
