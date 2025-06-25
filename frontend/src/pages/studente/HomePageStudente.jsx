import React from 'react';

import Footer from '../../components/footer/Footer'; 
import Header from '../../components/Header/HeaderStudente'; 
import Corpo from '../../components/studente/CorpoHomePage';

const HomePageStudente = () => {
    return (
        <>
            <Header /> 
            <Corpo />
            <Footer /> 
        </>
    );
};

export default HomePageStudente;