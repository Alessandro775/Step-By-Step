import React from "react";

import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderStudente";
import Corpo from "../../components/studente/CorpoHomePage";

const HomePageStudente = () => {
  return (
    <>
      <Header /> {/* componente Header*/}
      <Corpo /> {/*componente corpo della pagina homePageStudente */}
      <Footer /> {/*componente Footer */}
    </>
  );
};

export default HomePageStudente;
