import React from "react";
import Footer from "../../components/footer/Footer";
import Header from "../../components/Header/HeaderStudente";
import CorpoEsercizioAudio from "../../components/studente/corpoEsercizioAudio"; // ✅ Importa il componente corretto
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
