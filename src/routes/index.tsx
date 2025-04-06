import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import GameSetup from "../pages/GameSetup";
import GamePlay from "../pages/GamePlay";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/setup" element={<GameSetup />} />
      <Route path="/play" element={<GamePlay />} />
    </Routes>
  );
};

export default AppRoutes;
