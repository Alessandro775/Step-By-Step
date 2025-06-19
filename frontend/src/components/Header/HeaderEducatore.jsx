import React, { useState } from 'react';
import header from './header.module.css'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logosito.png'

const HeaderEducatore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  // Funzioni per la navigazione
  const goToHome = () => navigate('/home-educatore');
  const goToStudenti = () => navigate('/studenti-educatore');
  const goToProfilo = () => navigate('/profilo-educatore');
  
  // Verifica se siamo nella pagina del profilo
  const isProfilePage = location.pathname === '/profilo-educatore';

  // Funzione per mostrare la conferma
  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  // Funzione di logout confermato
  const confirmLogout = () => {
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    navigate('/');
    setShowConfirm(false);
  };

  // Funzione per annullare il logout
  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <div className={header.container}>
        <button className={header.logoButton} onClick={goToHome}>
          <img src={logo} alt="Logo" className={header.logo} />
        </button>
        
        <h1 className={header.title}>Step By Step</h1>
        
        <nav className={header.nav}>
          <ul className={header['nav-list']}>

            <li><button onClick={goToStudenti}>Studenti</button></li>

            
            {!isProfilePage && (
              <button className={header.navButton} onClick={goToProfilo}>Profilo </button>
             )}
            {isProfilePage && ( 
                <button 
                  className={header.logoutButton} 
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              
            )}
          </ul>
        </nav>
      </div>

      {/* Modal di conferma */}
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

export default HeaderEducatore;
