import React from 'react';

import Footer from '../../components/footer/Footer'; // Importa il componente Footer
import Header from '../../components/Header/Header'; // Importa il componente Header
import CorpoChiSiamo from '../../components/corpo/corpoChiSiamo';

const HomePage = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <CorpoChiSiamo/>
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default HomePage;