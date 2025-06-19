import React from 'react';
import Footer from '../../components/footer/Footer';
import Header from '../../components/Header/HeaderStudente';
import CorpoEsercizioAudio from '../../components/studente/corpoEsercizioAudio'; // ✅ Importa il componente corretto


const EsercizioAudio = () => {
    return (
        <>
            <Header />
            <CorpoEsercizioAudio /> {/* ✅ Usa il componente integrato che gestisce tutto */}
            <Footer />
        </>
    );
};

export default EsercizioAudio;