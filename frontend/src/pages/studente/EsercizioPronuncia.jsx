import React from "react";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderStudente";
import CorpoEsercizioAudio from "../../components/studente/corpoEsercizioAudio"; // 
import { useLogicaEsercizio } from "../../hooks/useLogicaEsercizio";

const EsercizioAudio = () => {
  const { esercizi, loading, startEsercizio } = useLogicaEsercizio();

  return (
    <>
      <Header /> {/* componente Header*/}
      <CorpoEsercizioAudio /> {/* corpo dell'esercizio Audio*/}
      <Footer /> {/*componente Footer*/}
    </>
  );
};

export default EsercizioAudio;
