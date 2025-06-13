import React from 'react';
import Footer from '../../components/footer/Footer';
import HeaderEducatore from '../../components/Header/HeaderEducatore';
import StudentiEducatoreContent from '../../components/educatore/StudentiEducatore';
import styles from './StudentiEducatore.module.css';

const StudentiEducatore = () => {
    return (
        <div className={styles.pageContainer}>
            <HeaderEducatore />
            <main className={styles.mainContent}>
                <StudentiEducatoreContent />
            </main>
            <Footer />
        </div>
    );
};

export default StudentiEducatore;