import React from "react";

import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import Corpo from "../../components/corpo/corpoHomePage";

const HomePage = () => {
  return (
    <>
      {/*componenti richiamati */}
      <Header /> {/*  componente Header*/}
      <Corpo /> {/*componente corpo della pagina homePage */}
      <Footer /> {/*componente Footer */}
    </>
  );
};

export default HomePage;
