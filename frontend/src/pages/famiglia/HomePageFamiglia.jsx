import React from "react";

import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderFamiglia"; 
import Cronologia from "../../components/famiglia/CronologiaFamiglia/CronologiaFamiglia";

const HomePageFamiglia = () => {
  return (
    <>
      {/*componenti richiamati */}
      <Header /> {/*  componente Header*/}
      <Cronologia /> {/*componente corpo della cronologia */}
      <Footer /> {/*componente Footer */}
    </>
  );
};

export default HomePageFamiglia;
