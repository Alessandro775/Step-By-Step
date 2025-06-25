import React from 'react';

import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header'; 
import Corpo from '../../components/corpo/corpoChiSiamo';

const HomePage = () => {
    return (
        <>
            <Header /> 
            <Corpo/>
            <Footer /> 
        </>
    );
};

export default HomePage;