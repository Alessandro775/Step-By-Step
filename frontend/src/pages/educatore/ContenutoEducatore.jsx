import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ AGGIUNGI QUESTO
import Footer from '../../components/footer/Footer';
import Header from '../../components/Header/HeaderEducatore';
import Contenuto from '../../components/educatore/Contenuto/ContenutoStudente';

const ContenutoEducatore = () => {
    const navigate = useNavigate(); // ✅ AGGIUNGI QUESTO

    // ✅ FUNZIONE PER TORNARE ALLA LISTA STUDENTI
    const handleTornaIndietro = () => {
        sessionStorage.removeItem('studenteSelezionato');
        navigate('/home-educatore'); // Modifica con il tuo percorso corretto
    };

    // ✅ AGGIUNGI LISTENER PER IL PULSANTE TORNA INDIETRO DEL COMPONENTE
    useEffect(() => {
        const handleBackEvent = () => {
            handleTornaIndietro();
        };

        window.addEventListener('backToStudenti', handleBackEvent);

        return () => {
            window.removeEventListener('backToStudenti', handleBackEvent);
        };
    }, []);

    return (
        <>
            <Header />
            <Contenuto />
            <Footer />
        </>
    );
};

export default ContenutoEducatore;
