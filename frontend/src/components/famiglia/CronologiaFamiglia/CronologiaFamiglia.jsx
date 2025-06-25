import React from "react";
import CronologiaBase from "../../condivisi/Cronologia/CronologiaBase";
import styles from "./CronologiaFamiglia.module.css";

const CronologiaFamiglia = () => {
  const styleClasses = {
    contenitore: styles.contenitore,
    intestazione: styles.intestazione,
    intestazioneCentrale: styles.intestazioneCentrale,
    intestazioneDestra: styles.intestazioneDestra,
    infoUtente: styles.infoStudente,
    bottoneToggleGrafici: styles.bottoneToggleGrafici,
    contenuto: styles.sezioneContenuto
  };

  return (
    <CronologiaBase
      apiEndpoint="family-cronologia"
      titolo="Cronologia di tuo figlio"
      sottotitolo="Visualizza i progressi di tuo figlio negli esercizi"
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📊 Mostra Cronologia"
      mostraFormatoCompleto={true}
      styleClasses={styleClasses}
    />
  );
};

export default CronologiaFamiglia;
