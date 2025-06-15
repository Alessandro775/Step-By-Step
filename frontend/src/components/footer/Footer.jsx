import React from 'react';
import styles from "./Footer.module.css";
import unibaLogo from "../../assets/logouniba.jpeg";
import siteLogo from "../../assets/logosito.png";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img src={siteLogo} alt="Logo del sito" className={styles.logo} />
          <img src={unibaLogo} alt="Logo Università di Bari" className={styles.logo} />
        </div>
      </div>
      
      <div className={styles.centerSection}>
        <h4>Dipartimento di Informatica</h4>
        <p>Università degli Studi di Bari "Aldo Moro"</p>
        <div className={styles.address}>
          <span>Via Edoardo Orabona, 4</span>
          <span>70125 Bari (BA), Italia</span>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <h4>Contatti</h4>
        <div className={styles.contactInfo}>
          <span>📞 +39 080 544 2264</span>
          <span>✉️ info@di.uniba.it</span>
        </div>
        <p className={styles.description}>
          Web app per il potenziamento della fonologia nei ragazzi con DSA
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
