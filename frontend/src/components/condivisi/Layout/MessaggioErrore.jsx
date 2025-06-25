import React from 'react';
import styles from './Layout.module.css';

const MessaggioErrore = ({ 
  titolo = "Errore", 
  messaggio, 
  mostraBottoneTorna = false, 
  onTornaIndietro 
}) => (
  <div className={styles.contenitoreErrore}>
    <h2>{titolo}</h2>
    <p>{messaggio}</p>
    {mostraBottoneTorna && (
      <button onClick={onTornaIndietro} className={styles.bottoneIndietro}>
        Torna Indietro
      </button>
    )}
  </div>
);

export default MessaggioErrore;
