import HomePage from "../pages/HomePage";
import { Route, Routes } from "react-router-dom";

function RoutesPath() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
        <Route path="/Home" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default RoutesPath;