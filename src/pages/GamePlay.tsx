import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

const GamePlay = () => {
  const navigate = useNavigate();
  const { players, gameMode, currentPhase, currentPlayerIndex } =
    useGameStore();

  // Redirect to setup if no game is initialized
  useEffect(() => {
    if (players.length === 0) {
      navigate("/setup");
    }
  }, [players, navigate]);

  return (
    <div className="min-h-screen bg-green-800 p-4 text-white">
      <div className="bg-green-700 rounded-lg p-4 mb-4">
        <h1 className="text-xl font-bold mb-2">28 Card Game</h1>
        <div className="flex justify-between text-sm">
          <div>Mode: {gameMode}</div>
          <div>Phase: {currentPhase}</div>
          <div>
            Current Player: {players[currentPlayerIndex]?.name || "Unknown"}
          </div>
        </div>
      </div>

      <div className="grid place-items-center h-[calc(100vh-150px)]">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Gameplay Coming Soon</h2>
          <p className="mb-6">
            This is a placeholder for the full game implementation.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
