import React from 'react';
import styles from './corpo.module.css';
import stopwatch from '../../assets/stopwatch-graphic-icon-design-template-png_302689-removebg-preview.png';
import sillabe from '../../assets/sillabe-removebg-preview.png';
import pronuncia from '../../assets/pronuncia-removebg-preview.png';
//componente esercizi svolti semplicemente descrizioni con titoli sottotitoli e testi 
const CorpoEserciziSvolti = () => {
    return (
        <div className={styles.corpoEserciziSvolti}>
            <div className={styles.headerSection}>
                <h1 className={styles.titoloEsempio}>Esempio Esercizi</h1>
                <h2 className={styles.sottotitoloEsempio}>Gli esercizi offerti sono di tre tipologie</h2>
            </div>
            
            <div className={styles.eserciziContainer}>
                <div className={styles.esercizio}>
                    <img src={stopwatch} alt="Esercizio" className={styles.immaginEsercizio}/>{/*caricamento immagine*/}
                    <div className={styles.descrizione}>
                        <h3>Prova a tempo</h3>
                        <p>Allo studente viene assegnato un testo da leggere. Al via del tempo, deve leggerlo il più rapidamente possibile, mantenendo una corretta pronuncia, comprensione del significato e fluidità nella lettura, evitando errori fonetici o lessicali. Al termine della lettura, il tempo viene fermato e registrato. Questo tempo sarà confrontato con quelli ottenuti in precedenza.</p>
                    </div>
                </div>

                <div className={styles.esercizio}>
                    <img src={sillabe} alt="Esercizio" className={styles.immaginEsercizio}/>{/*caricamento immagine*/}
                    <div className={styles.descrizione}>
                        <h3>Divisione in sillabe</h3>
                        <p>Allo studente viene mostrata un'immagine rappresentante una parola. Sotto l'immagine sono disposte diverse carte contenenti sillabe, alcune corrette e altre errate. Il compito dello studente è selezionare le sillabe corrette, nell'ordine appropriato, per comporre correttamente la parola rappresentata, rispettando la corretta divisione in sillabe.</p>
                    </div>
                </div>

                <div className={styles.esercizio}>
                    <img src={pronuncia} alt="Esercizio" className={styles.immaginEsercizio}/>{/*caricamento immagine*/}
                    <div className={styles.descrizione}>
                        <h3>Pronuncia corretta</h3>
                        <p>All'alunno viene mostrata un'immagine accompagnata dal nome dell'oggetto rappresentato. Attivando il microfono, l'alunno pronuncia la parola. Una volta conclusa la registrazione, il microfono viene disattivato e il sistema, tramite l'analisi vocale basata su GPT, valuta la pronuncia e fornisce un feedback dettagliato sulla correttezza e la qualità dell'esecuzione.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorpoEserciziSvolti;