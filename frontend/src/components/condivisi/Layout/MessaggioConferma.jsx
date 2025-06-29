import React from 'react';
import styles from './MessaggioConferma.module.css';

const MessaggioConferma = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  onClose,
  variant = 'default'
}) => {
  // Non renderizza nulla se il dialogo non è aperto
  if (!isOpen) return null;
// Gestisce la chiusura del dialogo al clic sul backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
// Gestisce gli eventi della tastiera per confermare o annullare
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getVariantIcon = () => {
    switch (variant) {
      case 'danger': return '⚠️'; //azioni pericolose
      case 'warning': return '🔔'; //avvisi importanti
      default: return '❓';//conferma generiche
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      {/* Container principale del dialogo con styling dinamico */}
      <div className={`${styles.dialog} ${styles[variant]}`}>
        <div className={styles.header}>
          <div className={styles.icon}>{getVariantIcon()}</div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        
        <div className={styles.footer}>
          {/* Pulsante di conferma con styling dinamico */}
          <button 
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onCancel}
            autoFocus={variant !== 'danger'}
          >
            {cancelText}
          </button>
          <button 
            className={`${styles.button} ${styles.confirmButton} ${styles[`${variant}Confirm`]}`}
            onClick={onConfirm}
            autoFocus={variant === 'danger'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessaggioConferma;
