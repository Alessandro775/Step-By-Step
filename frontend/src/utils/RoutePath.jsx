// Import pagine pubbliche
import HomePage from "../pages/non loggato/HomePage";
import LoginPage from "../pages/non loggato/LoginPage"; 
import RegisterPage from "../pages/non loggato/RegisterPage";
import ChiSiamo from "../pages/non loggato/ChiSiamo";
import EsempioEsercizio from "../pages/non loggato/EsempioEsercizio";

// Import pagine studente
import ProfuloStudente from "../pages/studente/ProfiloStudente";
import EsercizioPronuncia from "../pages/studente/EsercizioPronuncia";
import HomePageStudente from "../pages/studente/HomePageStudente";  
import CronologiaStudente from "../pages/studente/CronologiaStudente";
 // Importa il componente CorpoHomePage

// Import pagine educatore
import ProfiloEducatore from "../pages/educatore/ProfiloEducatore";
import StudentiEducatore from "../pages/educatore/StudentiEducatore";// Importa il componente CorpoHomePage
import CronologiaEducatore from "../pages/educatore/CronologiaEducatore";
import ContenutoEducatore from "../pages/educatore/ContenutoEducatore";

// Import pagine famiglia
import ProfiloFamiglia from "../pages/famiglia/ProfiloFamiglia";
import HomePageFamiglia from "../pages/famiglia/HomePageFamiglia";

import { Route, Routes } from "react-router-dom";

function RoutesPath() {
  return (
    <Routes>
      {/* Routes pubbliche */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrazione" element={<RegisterPage />} />
      <Route path="/chi-siamo" element={<ChiSiamo />} />
      <Route path="/esempio-esercizio" element={<EsempioEsercizio />} />

      {/* Routes studente */}
      <Route path="/profilo-studente" element={<ProfuloStudente />} />
      <Route path="/esercizio-pronuncia" element={<EsercizioPronuncia />} />
      <Route path="/home-studente" element={<HomePageStudente />} />
      <Route path="/cronologia-studente" element={<CronologiaStudente />} />

      {/* Routes educatore */}
      <Route path="/profilo-educatore" element={<ProfiloEducatore />} />
      <Route path="/home-educatore" element={<StudentiEducatore />} />
      <Route path="/cronologia-educatore" element={<CronologiaEducatore />} />
      <Route path="/contenuto-educatore" element={<ContenutoEducatore />} />

      {/* Routes famiglia */}
      <Route path="/profilo-famiglia" element={<ProfiloFamiglia />} />
      <Route path="/home-famiglia" element={<HomePageFamiglia />} />

      {/* Route di fallback */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default RoutesPath;