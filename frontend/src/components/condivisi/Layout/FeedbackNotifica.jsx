import React, { useState, useEffect } from 'react';
import styles from './FeedbackNotifica.module.css';

const FeedbackNotifica = ({
  messaggio,
  tipo = "info", // "success", "error", "warning", "info"
  durata = 4000, // millisecondi
  onClose,
  mostraChiudi = true,
  posizione = "topRight",
  animazione = "slide",
  icona = "auto", // "auto" usa icona predefinita, oppure passa icona custom
  azione = null, // { testo: "Annulla", onClick: () => {} }
  persistente = false // se true, non si chiude automaticamente
}) => {
  const [visibile, setVisibile] = useState(true);
  const [chiusuraInCorso, setChiusuraInCorso] = useState(false);

  useEffect(() => {
    // Imposta timer solo per notifiche non persistenti con durata valida
    if (!persistente && durata > 0) {
      const timer = setTimeout(() => {
        handleChiudi();
      }, durata);
// Cleanup: cancella il timer se il componente si smonta o le dipendenze cambiano
      return () => clearTimeout(timer);
    }
  }, [durata, persistente]); // Riesegue se cambiano durata o persistenza

  const handleChiudi = () => {
    // Avvia l'animazione di chiusura
    setChiusuraInCorso(true);
    //Dopo l'animazione, rimuove dal DOM e chiama callback
    setTimeout(() => {
      setVisibile(false);
      if (onClose) onClose();
    }, 300); // Tempo per animazione di uscita
  };

  const getIcona = () => {
    if (icona !== "auto") return icona;
    //azioni predefinite in base a cosa succede
    switch (tipo) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      default: return "📢";
    }
  };

  const getClasseCSS = () => {
    let classi = [styles.notifica, styles[tipo], styles[posizione], styles[animazione]];
    
    if (chiusuraInCorso) {
      classi.push(styles.chiusura);
    }
    
    return classi.join(' ');
  };

  if (!visibile) return null; // Non renderizza nulla se la notifica non è più visibile

  return (
    <div className={getClasseCSS()}>
      {/*xontenuto principale*/}
      <div className={styles.contenuto}>
        <div className={styles.iconaMessaggio}>
          <span className={styles.icona}>{getIcona()}</span>
          <span className={styles.testo}>{messaggio}</span>
        </div>
        {/* Pulsante azione personalizzata */}
        <div className={styles.azioni}>
          {azione && (
            <button 
              className={styles.bottoneAzione} 
              onClick={azione.onClick}
            >
              {azione.testo}
            </button>
          )}
          {/* Pulsante chiusura manuale*/}
          {mostraChiudi && (
            <button 
              className={styles.bottoneChiudi} 
              onClick={handleChiudi}
              title="Chiudi notifica"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {/* Mostra solo per notifiche non persistenti con durata definita */}
      {!persistente && durata > 0 && (
        <div 
          className={styles.barraProgresso}
          style={{ 
            animationDuration: `${durata}ms`,
            animationPlayState: chiusuraInCorso ? 'paused' : 'running'
          }}
        />
      )}
    </div>
  );
};

export default FeedbackNotifica;
