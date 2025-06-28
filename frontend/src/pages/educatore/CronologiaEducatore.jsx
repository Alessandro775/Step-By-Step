import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ AGGIUNGI QUESTO
import Footer from '../../components/footer/Footer'; 
import Header from '../../components/Header/HeaderEducatore'; 
import Cronologia from '../../components/educatore/Cronologia/CronologiaEducatore'; 

const CronologiaEducatore = () => {
    const navigate = useNavigate(); // ✅ AGGIUNGI QUESTO
    const [studenteSelezionato, setStudenteSelezionato] = useState(null);

    useEffect(() => {
        // ✅ RECUPERA I DATI DELLO STUDENTE DAL sessionStorage
        const studenteData = sessionStorage.getItem('studenteSelezionato');
        if (studenteData) {
            const parsedData = JSON.parse(studenteData);
            setStudenteSelezionato(parsedData);
        }
    }, []);

    // ✅ FUNZIONE PER TORNARE ALLA LISTA STUDENTI
    const handleTornaIndietro = () => {
        sessionStorage.removeItem('studenteSelezionato');
        navigate('/home-educatore'); // Modifica con il tuo percorso corretto
    };

    return (
        <>
            <Header /> 
            <Cronologia 
                studenteSelezionato={studenteSelezionato}
                onTornaIndietro={handleTornaIndietro}
            /> 
            <Footer /> 
        </>
    );
};

export default CronologiaEducatore;
