import React from 'react';
import styles from './Layout.module.css';

const CaricamentoSpinner = ({ messaggio = "Caricamento..." }) => (
  <div className={styles.contenitoreCaricamento}>
    <div className={styles.spinner}></div>
    <p>{messaggio}</p>
  </div>
);

export default CaricamentoSpinner;
