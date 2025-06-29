import React from "react";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import Corpo from "../../components/corpo/corpoEserciziSvolti";

const EsempioEsercizio = () => {
  return (
    <>
      {/*componenti richiamati */}
      <Header /> {/*  componente Header*/}
      <Corpo /> {/*componente corpo della pagina esempio esercizio */}
      <Footer /> {/*componente Footer */}
    </>
  );
};

export default EsempioEsercizio;
