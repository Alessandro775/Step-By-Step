import React from 'react';
import styles from './CorpoHomePageFamiglia.module.css';
import { useNavigate } from 'react-router-dom';

const CorpoHomePageFamiglia = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.titolo}>Cronologia</h1>
    </div>
  );
};

export default CorpoHomePageFamiglia;
