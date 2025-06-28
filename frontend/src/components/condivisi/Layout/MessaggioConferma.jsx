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
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

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
      case 'danger': return '⚠️';
      case 'warning': return '🔔';
      default: return '❓';
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={`${styles.dialog} ${styles[variant]}`}>
        <div className={styles.header}>
          <div className={styles.icon}>{getVariantIcon()}</div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        
        <div className={styles.footer}>
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
