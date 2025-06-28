import React from "react";
import CronologiaBase from "../../condivisi/Cronologia/CronologiaBase";

const CronologiaStudente = () => {

  return (
    <CronologiaBase
      apiEndpoint="student-cronologia"
      titolo="La Mia Cronologia Esercizi"
      sottotitolo="Visualizza i tuoi progressi negli esercizi"
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📋 Mostra Tabella"
      mostraFormatoCompleto={true}
    />
  );
};

export default CronologiaStudente;
