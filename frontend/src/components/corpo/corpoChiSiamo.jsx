import React from 'react';
import styles from './corpo.module.css';

const CorpoChiSiamo = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h2 className={styles.titolo}>Chi siamo?</h2>
                <p className={styles.testo}>
                 Siamo tre studenti dell'Università degli studi di Bari "Aldo Moro" con una grande sensibilità nei confronti di bambini e ragazzi con Disturbi Specifici dell'Apprendimento (DSA), in particolare dislessia e disortografia. Il nostro obiettivo è fornire uno strumento utile e accessibile per migliorare le loro abilità linguistiche attraverso esercizi interattivi e monitoraggio dei progressi.
                </p>


                <h3 className={styles.sottotitolo}>Contattaci!</h3>
                <ul className={styles.testo}>
                    <li>Bello Nicolas: n.bello3@studenti.uniba.it</li>
                    <li>Leone Francesca: f.leone56@studenti.uniba.it</li>
                    <li>Licchetta Alessandro: a.licchetta2@studenti.uniba.it</li>
                </ul>


            </div>
        </div>
    );
};

export default CorpoChiSiamo;