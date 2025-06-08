import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import ChiSiamo from "../pages/ChiSiamo";
import { Route, Routes } from "react-router-dom";

function RoutesPath() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chi siamo" element={<ChiSiamo />} />
        <Route path="*" element={<HomePage />} /> {/* Questa rotta gestisce i percorsi non trovati */}
      </Routes>
    </>
  );
}

export default RoutesPath;