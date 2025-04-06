import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

const GameSetup = () => {
  const navigate = useNavigate();
  const initializeGame = useGameStore((state) => state.initializeGame);

  // Local state for setup options
  const [gameMode, setGameMode] = useState<"3p" | "4p">("4p");
  const [playerNames, setPlayerNames] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
  ]);
  const [targetScore, setTargetScore] = useState<number>(8);

  // Update player name
  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  // Handle game start
  const handleStartGame = () => {
    // Trim player array to correct length based on game mode
    const playerCount = gameMode === "3p" ? 3 : 4;
    const gamePlayers = playerNames
      .slice(0, playerCount)
      .map((name) => name.trim() || `Player ${playerNames.indexOf(name) + 1}`);

    // Initialize the game in the store
    initializeGame(gamePlayers, gameMode);

    // Update target score
    useGameStore.setState((state) => {
      state.targetScore = targetScore;
    });

    // Navigate to the gameplay screen
    navigate("/play");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 flex flex-col items-center justify-center">
      <div className="bg-white text-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          28 Card Game Setup
        </h1>

        {/* Game Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Game Mode</label>
          <div className="flex gap-4">
            <button
              onClick={() => setGameMode("3p")}
              className={`flex-1 py-2 px-4 rounded-md ${
                gameMode === "3p"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              3 Players
            </button>
            <button
              onClick={() => setGameMode("4p")}
              className={`flex-1 py-2 px-4 rounded-md ${
                gameMode === "4p"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              4 Players
            </button>
          </div>
        </div>

        {/* Player Names */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Player Names</label>
          <div className="space-y-3">
            {playerNames
              .slice(0, gameMode === "3p" ? 3 : 4)
              .map((name, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-20 text-sm text-gray-600">
                    {index === 0
                      ? "(Dealer)"
                      : index === 1
                      ? "(First Bidder)"
                      : ""}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="flex-grow p-2 border rounded"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Target Score to Win
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full p-2 border rounded"
            aria-label="Select target score"
          >
            <option value={6}>6 Points</option>
            <option value={8}>8 Points</option>
            <option value={10}>10 Points</option>
            <option value={12}>12 Points</option>
          </select>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default GameSetup;
