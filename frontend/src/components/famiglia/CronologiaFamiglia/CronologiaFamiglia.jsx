import React from "react";
import CronologiaBase from "../../condivisi/Cronologia/CronologiaBase";

const CronologiaFamiglia = () => {
  return (
    //varie conofigurazioni
    <CronologiaBase
      apiEndpoint="family-cronologia"
      titolo="Cronologia di tuo figlio"
      sottotitolo="Visualizza i progressi di tuo figlio negli esercizi"
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📊 Mostra Cronologia"
      mostraFormatoCompleto={true}
    />
  );
};

export default CronologiaFamiglia;
