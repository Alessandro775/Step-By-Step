import React from "react";
import CronologiaBase from "../../condivisi/Cronologia/CronologiaBase";
import styles from "./CronologiaStudente.module.css";

const CronologiaStudente = () => {
  // ✅ DEFINISCI la funzione mancante
  const handleTornaIndietro = () => {
    // Opzioni possibili:
    // 1. Torna alla pagina precedente
    window.history.back();
    
    // 2. Vai alla home dello studente
    // window.location.href = '/studente/home';
    
    // 3. Emetti evento per componente genitore
    // const event = new CustomEvent("backToHome");
    // window.dispatchEvent(event);
  };

  return (
    <CronologiaBase
      apiEndpoint="student-cronologia"
      titolo="La Mia Cronologia Esercizi"
      sottotitolo="Visualizza i tuoi progressi negli esercizi"
      mostraBottoneTorna={true}
      onTornaIndietro={handleTornaIndietro} // ✅ USA la funzione definita
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📋 Mostra Tabella"
      mostraFormatoCompleto={true}
    />
  );
};

export default CronologiaStudente;
