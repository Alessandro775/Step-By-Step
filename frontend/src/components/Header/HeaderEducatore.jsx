import React from 'react';
import header from './header.module.css'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../../assets/logosito.png'
import ContainerNotifiche from '../condivisi/Layout/ContainerNotifiche';
import DialogoConferma from '../condivisi/Layout/DialogoConferma';
import { useFeedback } from '../../hooks/useFeedback';
import { usaDialogoConferma } from '../../hooks/usaDialogoConferma';

const HeaderEducatore = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Integrazione sistema feedback
  const { notifiche, successo, errore } = useFeedback();
  
  // Integrazione sistema conferma
  const { 
    statoDialogo, 
    mostraConferma, 
    gestisciConferma, 
    gestisciAnnulla 
  } = usaDialogoConferma();

  // Funzioni per la navigazione
  const goToHome = () => navigate('/home-educatore');
  const goToProfilo = () => navigate('/profilo-educatore');
  
  // Verifica se siamo nella pagina del profilo
  const isProfilePage = location.pathname === '/profilo-educatore';

  // Funzione per mostrare la conferma di logout
  const handleLogoutClick = async () => {
    const conferma = await mostraConferma({
      titolo: "Conferma Logout",
      messaggio: "Sei sicuro di voler effettuare il logout?",
      testoConferma: "Sì, Logout",
      testoAnnulla: "Annulla",
      variante: "avviso"
    });

    if (conferma) {
      confirmLogout();
    }
  };

  // Funzione di logout confermato
  const confirmLogout = () => {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('token');
      localStorage.removeItem('ruolo');
      sessionStorage.clear();
      
      navigate('/');
      
    } catch (error) {
      console.error('Errore durante il logout:', error);
      errore('Errore durante il logout', { durata: 4000 });
    }
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
            {!isProfilePage && (
              <button className={header.navButton} onClick={goToProfilo}>
                Profilo 
              </button>
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

      {/* Sistema di notifiche integrato */}
      <ContainerNotifiche notifiche={notifiche} />

      {/* Dialogo di conferma integrato */}
      <DialogoConferma
        aperto={statoDialogo.aperto}
        titolo={statoDialogo.titolo}
        messaggio={statoDialogo.messaggio}
        testoConferma={statoDialogo.testoConferma}
        testoAnnulla={statoDialogo.testoAnnulla}
        variante={statoDialogo.variante}
        onConferma={gestisciConferma}
        onAnnulla={gestisciAnnulla}
        onChiudi={gestisciAnnulla}
      />
    </>
  );
};

export default HeaderEducatore;
