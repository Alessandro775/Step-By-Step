import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import ChiSiamo from "../pages/ChiSiamo";
import EsempioEsercizio from "../pages/EsempioEsercizio"; // Aggiungi questa riga
import EsercizioAudio from "../pages/EsercizioAudio"; // Aggiungi questa riga per importare la pagina degli esercizi
import EducatorPage from "../pages/EducatorPage";
import FamilyPage from "../pages/FamilyPage";
import { Route, Routes } from "react-router-dom";


function RoutesPath() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrazione" element={<RegisterPage/>}/>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chi_siamo" element={<ChiSiamo />} />
        <Route path="/esercizi" element={<EsempioEsercizio />} />
        <Route path="/esercizio_audio" element={<EsercizioAudio />} /> {/* Aggiungi questa riga per gestire gli esercizi con ID */}
        <Route path="*" element={<HomePage />} /> {/* Questa rotta gestisce i percorsi non trovati */}
        <Route path="/educatore" element={<EducatorPage />} />
        <Route path="/famiglia" element={<FamilyPage />} />
        {/* Aggiungi altre rotte qui se necessario */}
      </Routes>
    </>
  );
}

export default RoutesPath;