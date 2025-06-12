import React from 'react';

import Footer from '../../components/footer/Footer'; // Importa il componente Footer
import Header from '../../components/Header/HeaderFamiglia'; // Importa il componente Header
import CorpoHomePage from '../../components/corpo/corpoHomePage';

const HomePageFamiglia = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <CorpoHomePage/>
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default HomePageFamiglia;