import React from 'react';
import styles from "./Footer.module.css";
import unibaLogo from "../../assets/logouniba.jpeg";
import siteLogo from "../../assets/logosito.png";

const Footer = () => (
    <div className={styles["footer-content"]}>
        <div className={styles["footer-logos"]}>
            <img src={siteLogo} alt="Site Logo" className={styles["site-logo"]} />
            <img src={unibaLogo} alt="Uniba Logo" className={styles["uniba-logo"]} />
        </div>
        <div className={styles["footer-contacts"]}>
            <h3>Contatti</h3>
            <ul>
                <li>a.licchetta2@studenti.uniba.it</li>
                <li>n.bello3@studenti.uniba.it</li>
                <li>f.leone56@studenti.uniba.it</li>
            </ul>
            <p className={styles["footer-dipartimento"]}>
                Dipartimento di Informatica dell’Università degli Studi di Bari "Aldo Moro"
            </p>
        </div>
        <div className={styles["footer-info"]}>
            <h3>Informazioni</h3>
            <p>
                Questa web app offre servizi e strumenti interattivi per il potenziamento della fonologia nei ragazzi con DSA.
            </p>
        </div>
    </div>
);

export default Footer;