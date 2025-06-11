import React, { useState, useEffect } from 'react';
import styles from './corpoHomePage.module.css';

const CorpoHomePage = () => {
    const [currentSection, setCurrentSection] = useState(0);
    const [isVisible, setIsVisible] = useState({});

    // Dati strutturati per il contenuto
    const dsaData = {
        intro: {
            title: "Cosa sono i DSA?",
            content: "I DSA, ovvero Disturbi Specifici dell'Apprendimento, sono disturbi del neurosviluppo che riguardano in modo selettivo alcune abilità scolastiche fondamentali, come la lettura, la scrittura e il calcolo. Non sono legati a problemi cognitivi, sensoriali, emotivi o ambientali, e non dipendono da una mancanza di impegno o attenzione. Chi ha un DSA può apprendere, ma ha bisogno di strumenti e strategie adeguate ai propri tempi e stili cognitivi."
        },
        disturbi: [
            {
                nome: "Dislessia",
                descrizione: "difficoltà nella lettura (lenta, poco accurata, faticosa)",
                icon: "📖",
                colore: "#4A90E2"
            },
            {
                nome: "Disortografia", 
                descrizione: "difficoltà nella scrittura corretta delle parole, soprattutto per quanto riguarda l'ortografia",
                icon: "✏️",
                colore: "#F5A623"
            },
            {
                nome: "Disgrafia",
                descrizione: "difficoltà nella scrittura a mano, legata alla componente grafica e motoria",
                icon: "✍️",
                colore: "#7ED321"
            },
            {
                nome: "Discalculia",
                descrizione: "difficoltà con i numeri, il calcolo e la comprensione dei concetti matematici",
                icon: "🔢",
                colore: "#D0021B"
            }
        ],
        servizi: [
            {
                icon: "🧠",
                titolo: "Esercizi interattivi sulla fonologia",
                descrizione: "progettati per potenziare la consapevolezza fonemica, la segmentazione delle parole, la rima e la corrispondenza suono-lettera"
            },
            {
                icon: "📊",
                titolo: "Monitoraggio dei progressi",
                descrizione: "ogni attività completata viene registrata, permettendo a studenti, genitori e insegnanti di seguire da vicino i miglioramenti nel tempo"
            },
            {
                icon: "🗂️",
                titolo: "Percorsi strutturati",
                descrizione: "suddivisi per livello di difficoltà e obiettivi specifici, per accompagnare l'apprendimento in modo graduale e personalizzato"
            },
            {
                icon: "🌱",
                titolo: "Ambiente positivo e motivante",
                descrizione: "in cui l'errore è parte del percorso e ogni passo avanti viene valorizzato"
            }
        ]
    };

    // Componente per i disturbi DSA
    const DisturboCard = ({ disturbo, index }) => (
        <div 
            className={`${styles.disturboCard} ${isVisible.disturbi ? styles.fadeIn : ''}`}
            style={{ 
                borderLeft: `4px solid ${disturbo.colore}`
            }}
        >
            <div className={styles.disturboIcon}>{disturbo.icon}</div>
            <div className={styles.disturboContent}>
                <h4 className={styles.disturboNome}>{disturbo.nome}</h4>
                <p className={styles.disturboDescrizione}>{disturbo.descrizione}</p>
            </div>
        </div>
    );

    // Componente per i servizi
    const ServizioCard = ({ servizio, index }) => (
        <div 
            className={`${styles.servizioCard} ${isVisible.servizi ? styles.slideIn : ''}`}
        >
            <div className={styles.servizioIcon}>{servizio.icon}</div>
            <div className={styles.servizioContent}>
                <h4 className={styles.servizioTitolo}>{servizio.titolo}</h4>
                <p className={styles.servizioDescrizione}>{servizio.descrizione}</p>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Sezione introduttiva */}
                <section className={`${styles.sezione} ${isVisible.intro ? styles.fadeIn : ''}`}>
                    <h2 className={styles.titolo}>{dsaData.intro.title}</h2>
                    <p className={styles.testo}>{dsaData.intro.content}</p>
                </section>

                {/* Sezione disturbi DSA */}
                <section className={styles.sezione}>
                    <h3 className={styles.sottotitolo}>I principali disturbi riconosciuti come DSA sono:</h3>
                    <div className={styles.disturbiGrid}>
                        {dsaData.disturbi.map((disturbo, index) => (
                            <DisturboCard 
                                key={disturbo.nome} 
                                disturbo={disturbo} 
                                index={index}
                            />
                        ))}
                    </div>
                </section>

                {/* Sezione progetto */}
                <section className={styles.sezione}>
                    <h3 className={styles.sottotitolo}>Il nostro progetto: supporto mirato per dislessia e disortografia</h3>
                    <div className={styles.progettoHighlight}>
                        <p className={styles.testo}>
                            Il nostro sito è pensato per aiutare bambini e ragazzi con dislessia e disortografia, 
                            con un approccio focalizzato sulla <strong className={styles.evidenziato}>fonologia</strong> — 
                            la capacità di riconoscere, distinguere e manipolare i suoni della lingua.
                        </p>
                    </div>
                </section>

                {/* Sezione servizi */}
                <section className={styles.sezione}>
                    <h3 className={styles.sottotitolo}>Cosa offriamo:</h3>
                    <div className={styles.serviziGrid}>
                        {dsaData.servizi.map((servizio, index) => (
                            <ServizioCard 
                                key={servizio.titolo} 
                                servizio={servizio} 
                                index={index}
                            />
                        ))}
                    </div>
                </section>

                {/* Sezione missione */}
                <section className={`${styles.sezione} ${styles.missioneSection}`}>
                    <h3 className={styles.sottotitolo}>La nostra missione</h3>
                    <div className={styles.missioneContent}>
                        <p className={styles.testo}>
                            Vogliamo costruire uno spazio inclusivo in cui ogni ragazzo con dislessia o disortografia 
                            possa allenare le proprie abilità linguistiche, superare le difficoltà con serenità, 
                            e sviluppare fiducia nelle proprie capacità.
                        </p>
                        <div className={styles.obiettivo}>
                            <strong>Il nostro obiettivo:</strong> rendere l'apprendimento più accessibile, 
                            più efficace e più umano.
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CorpoHomePage;
