import React from 'react';
import ContainerNotifiche from '../../condivisi/Layout/ContainerNotifiche';
import { useFeedback } from '../../../hooks/useFeedback';
import styles from './FormAggiungiStudente.module.css';

const FormAggiungiStudente = ({
  emailNuovoStudente, //stato controllato per il compo email
  setEmailNuovoStudente, // Setter per aggiornare l'email
  onSubmit, // Handler per l'invio del form
  adding // Flag per indicare operazione in corso
}) => {
  const { notifiche, avviso } = useFeedback();

  // Validazione email con feedback
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setEmailNuovoStudente(email);
    
    // Validazione in tempo reale
    if (email.length > 0 && !email.includes('@')) {
      avviso("L'email deve contenere il simbolo @", { durata: 2000 });
    }
  };

  // Gestione submit con validazione
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!emailNuovoStudente.trim()) {
      avviso("Inserisci un'email valida", { durata: 3000 });
      return;
    }
    // Regex completa per validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNuovoStudente.trim())) {
      avviso("Formato email non valido", { durata: 3000 });
      return;
    }
     // Se tutte le validazioni passano, chiama il callback parent
    onSubmit(e);
  };

  return (
    <div className={styles.formSection}>
      {/* Container per mostrare feedback e validazioni all'utente */}
      <ContainerNotifiche notifiche={notifiche} />
      <h2>Aggiungi Nuovo Studente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email dello studente (es: studente@scuola.it)"
            value={emailNuovoStudente} //valore controllato
            onChange={handleEmailChange} // Handler con validazione real-time
            required // Campo obbligatorio
            disabled={adding} // Disabilitato durante operazioni asincrone
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
