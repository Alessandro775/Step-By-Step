import React from "react";

import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import Corpo from "../../components/corpo/corpoChiSiamo";

const HomePage = () => {
  return (
    <>
      {/*componenti richiamati */}
      <Header /> {/*  componente Header*/}
      <Corpo /> {/*componente corpo della pagina Chi Siamo */}
      <Footer /> {/*componente Footer */}
    </>
  );
};

export default HomePage;
