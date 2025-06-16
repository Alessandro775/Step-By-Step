import React, { useState, useEffect } from 'react';
import styles from './corpoHomePage.module.css';

const CorpoHomePage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Esercizi da svolgere</h1>
      
      <div className={styles.exercisesGrid}>
        <div className={styles.exerciseCard}>
          <div className={styles.imageContainer}>
            <img 
              src="src\assets\stopwatch-graphic-icon-design-template-png_302689-removebg-preview.png" 
              alt="Prova a tempo" 
              className={styles.exerciseImage}
            />
          </div>
          <h3 className={styles.exerciseName}>Prova a tempo</h3>
        </div>

        <div className={styles.exerciseCard}>
          <div className={styles.imageContainer}>
            <img 
              src="src\assets\sillabe-removebg-preview.png" 
              alt="Divisione in sillabe" 
              className={styles.exerciseImage}
            />
          </div>
          <h3 className={styles.exerciseName}>Divisione in sillabe</h3>
        </div>

        <div className={styles.exerciseCard}>
          <div className={styles.imageContainer}>
            <img 
              src="src\assets\pronuncia-removebg-preview.png" 
              alt="Pronuncia corretta" 
              className={styles.exerciseImage}
            />
          </div>
          <h3 className={styles.exerciseName}>Pronuncia corretta</h3>
        </div>
      </div>
    </div>
  );
};

export default CorpoHomePage;
