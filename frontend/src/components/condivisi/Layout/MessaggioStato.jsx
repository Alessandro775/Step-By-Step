import React from 'react';
import styles from './MessaggioStato.module.css';

const MessaggiStato = ({ error, success, onClear }) => {
  if (!error && !success) return null;

  return (
    <div className={styles.messagesSection}>
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={onClear} className={styles.closeButton}>
            ×
          </button>
        </div>
      )}
      {success && (
        <div className={styles.success}>
          <span>{success}</span>
          <button onClick={onClear} className={styles.closeButton}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MessaggiStato;
