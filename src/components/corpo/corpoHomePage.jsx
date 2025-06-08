import React from 'react';
import styles from './corpoHomePage.module.css';

const CorpoHomePage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h2 className={styles.titolo}>Cosa sono i DSA?</h2>
                <p className={styles.testo}>
                    I DSA, ovvero <strong>Disturbi Specifici dell'Apprendimento</strong>, sono disturbi del neurosviluppo che riguardano in modo selettivo alcune abilità scolastiche fondamentali, come la lettura, la scrittura e il calcolo. Non sono legati a problemi cognitivi, sensoriali, emotivi o ambientali, e non dipendono da una mancanza di impegno o attenzione. Chi ha un DSA può apprendere, ma ha bisogno di strumenti e strategie adeguate ai propri tempi e stili cognitivi.
                </p>

                <h3 className={styles.sottotitolo}>I principali disturbi riconosciuti come DSA sono:</h3>
                <ul className={styles.testo}>
                    <li><strong>Dislessia:</strong> difficoltà nella lettura (lenta, poco accurata, faticosa).</li>
                    <li><strong>Disortografia:</strong> difficoltà nella scrittura corretta delle parole, soprattutto per quanto riguarda l'ortografia.</li>
                    <li><strong>Disgrafia:</strong> difficoltà nella scrittura a mano, legata alla componente grafica e motoria.</li>
                    <li><strong>Discalculia:</strong> difficoltà con i numeri, il calcolo e la comprensione dei concetti matematici.</li>
                </ul>

                <h3 className={styles.sottotitolo}>Il nostro progetto: supporto mirato per dislessia e disortografia</h3>
                <p className={styles.testo}>
                    Il nostro sito è pensato per aiutare bambini e ragazzi con dislessia e disortografia, con un approccio focalizzato sulla <strong>fonologia</strong> — la capacità di riconoscere, distinguere e manipolare i suoni della lingua. La fonologia è una competenza fondamentale per sviluppare una lettura più fluida e una scrittura più corretta.
                </p>

                <h3 className={styles.sottotitolo}>Cosa offriamo:</h3>
                <ul className={styles.testo}>
                    <li>🧠 <strong>Esercizi interattivi sulla fonologia</strong>, progettati per potenziare la consapevolezza fonemica, la segmentazione delle parole, la rima e la corrispondenza suono-lettera.</li>
                    <li>📊 <strong>Monitoraggio dei progressi:</strong> ogni attività completata viene registrata, permettendo a studenti, genitori e insegnanti di seguire da vicino i miglioramenti nel tempo.</li>
                    <li>🗂️ <strong>Percorsi strutturati</strong>, suddivisi per livello di difficoltà e obiettivi specifici, per accompagnare l'apprendimento in modo graduale e personalizzato.</li>
                    <li>🌱 <strong>Ambiente positivo e motivante</strong>, in cui l'errore è parte del percorso e ogni passo avanti viene valorizzato.</li>
                </ul>

                <h3 className={styles.sottotitolo}>La nostra missione</h3>
                <p className={styles.testo}>
                    Vogliamo costruire uno spazio inclusivo in cui ogni ragazzo con dislessia o disortografia possa allenare le proprie abilità linguistiche, superare le difficoltà con serenità, e sviluppare fiducia nelle proprie capacità. Il nostro obiettivo è rendere l'apprendimento più accessibile, più efficace e più umano.
                </p>
            </div>
        </div>
    );
};

export default CorpoHomePage;