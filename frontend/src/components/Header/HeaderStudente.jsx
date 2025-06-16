import React, { useState } from 'react';
import header from './header.module.css'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logosito.png'

const HeaderStudente = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  // Funzioni per la navigazione
  const goToHome = () => navigate('/home-studente');
  const goToCronologia = () => navigate('/cronologia-studente');
  const goToProfilo = () => navigate('/profilo-studente');

  // Verifica se siamo nella pagina del profilo
  const isProfilePage = location.pathname === '/profilo-studente';
  const isCronologyPage = location.pathname === '/cronologia-studente';

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    navigate('/');
    setShowConfirm(false);
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <div className={header.container}>
        <button className={header.logoButton} onClick={goToHome}>
          <img src={logo} alt="Logo" className={header.logo} />
        </button>
        
        <h1 className={header.title}>Dashboard Studente</h1>
        
        <nav className={header.nav}>
          <ul className={header['nav-list']}>

            {!isCronologyPage && (
              <li><button className={header.navButton} onClick={goToCronologia}>Cronologia</button></li>
            )}
            {!isProfilePage && (
              <button className={header.navButton} onClick={goToProfilo}>Profilo </button>
            )}
            {isProfilePage && (
              <li>
                <button 
                  className={header.logoutButton} 
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {showConfirm && (
        <div className={header.modalOverlay}>
          <div className={header.modalContent}>
            <h3>Conferma Logout</h3>
            <p>Sei sicuro di voler effettuare il logout?</p>
            <div className={header.modalButtons}>
              <button 
                className={header.confirmButton} 
                onClick={confirmLogout}
              >
                Conferma
              </button>
              <button 
                className={header.cancelButton} 
                onClick={cancelLogout}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderStudente;
