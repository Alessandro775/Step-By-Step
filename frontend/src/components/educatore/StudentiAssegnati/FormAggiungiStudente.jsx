import React from 'react';
import ContainerNotifiche from '../../condivisi/Layout/ContainerNotifiche';
import { useFeedback } from '../../../hooks/useFeedback';
import styles from './FormAggiungiStudente.module.css';

const FormAggiungiStudente = ({
  emailNuovoStudente,
  setEmailNuovoStudente,
  onSubmit,
  adding
}) => {
  const { notifiche, avviso } = useFeedback();

  // ✅ Validazione email con feedback
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setEmailNuovoStudente(email);
    
    // Validazione in tempo reale
    if (email.length > 0 && !email.includes('@')) {
      avviso("L'email deve contenere il simbolo @", { durata: 2000 });
    }
  };

  // ✅ Gestione submit con validazione
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!emailNuovoStudente.trim()) {
      avviso("Inserisci un'email valida", { durata: 3000 });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNuovoStudente.trim())) {
      avviso("Formato email non valido", { durata: 3000 });
      return;
    }
    
    onSubmit(e);
  };

  return (
    <div className={styles.formSection}>
      <ContainerNotifiche notifiche={notifiche} />
      
      <h2>Aggiungi Nuovo Studente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email dello studente (es: studente@scuola.it)"
            value={emailNuovoStudente}
            onChange={handleEmailChange}
            required
            disabled={adding}
            className={styles.emailInput}
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={adding || !emailNuovoStudente.trim()}
            className={styles.addButton}
            title={adding ? "Aggiunta in corso..." : "Aggiungi lo studente alla tua lista"}
          >
            {adding ? "⏳ Aggiungendo..." : "✅ Aggiungi Studente"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormAggiungiStudente;
