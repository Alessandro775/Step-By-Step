import React, { useEffect } from 'react';
import styles from './DialogoConferma.module.css';

const DialogoConferma = ({ 
  aperto = false,
  titolo = "Conferma",
  messaggio = "Sei sicuro?", 
  testoConferma = "Conferma",
  testoAnnulla = "Annulla",
  variante = "default", // "default", "pericolo", "avviso"
  onConferma,
  onAnnulla,
  onChiudi,
  caricamento = false
}) => {
  // Gestione escape e enter
  useEffect(() => {
    const gestisciTasti = (evento) => {
      if (!aperto) return;
      
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onAnnulla();
      } else if (evento.key === 'Enter') {
        evento.preventDefault();
        onConferma();
      }
    };

    document.addEventListener('keydown', gestisciTasti);
    return () => document.removeEventListener('keydown', gestisciTasti);
  }, [aperto, onConferma, onAnnulla]);

  // Blocca scroll del body quando aperto
  useEffect(() => {
    if (aperto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [aperto]);

  if (!aperto) return null;

  const gestisciClickSfondo = (evento) => {
    if (evento.target === evento.currentTarget) {
      onAnnulla();
    }
  };

  const ottieniIcona = () => {
    switch (variante) {
      case 'pericolo': return '⚠️';
      case 'avviso': return '🔔';
      default: return '❓';
    }
  };

  const ottieniClasseDialogo = () => {
    return `${styles.dialogo} ${styles[variante]}`;
  };

  const ottieniClassePulsanteConferma = () => {
    return `${styles.pulsante} ${styles.pulsanteConferma} ${styles[`conferma${variante.charAt(0).toUpperCase() + variante.slice(1)}`]}`;
  };

  return (
    <div className={styles.sovrapposizione} onClick={gestisciClickSfondo}>
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
