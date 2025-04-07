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
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute opacity-10 -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 blur-3xl"></div>
        <div className="absolute opacity-10 -bottom-64 -left-64 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Game Setup
          </h1>
          <p className="text-slate-400 mt-2">Configure your 28 card game</p>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Game Mode
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setGameMode("3p")}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 ${
                gameMode === "3p"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              3 Players
            </button>
            <button
              onClick={() => setGameMode("4p")}
              className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 ${
                gameMode === "4p"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              4 Players
            </button>
          </div>
        </div>

        {/* Player Names */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Player Names
          </label>
          <div className="space-y-3">
            {playerNames
              .slice(0, gameMode === "3p" ? 3 : 4)
              .map((name, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-20 text-xs text-slate-400 font-medium">
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
                    className="flex-grow p-2.5 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Score to Win
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full p-2.5 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none appearance-none"
            aria-label="Select target score"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "2.5rem",
            }}
          >
            <option value={6}>6 Points</option>
            <option value={8}>8 Points</option>
            <option value={10}>10 Points</option>
            <option value={12}>12 Points</option>
          </select>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 px-4 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-medium"
          >
            Back
          </button>

          <button
            onClick={handleStartGame}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-4 rounded-lg font-medium shadow-lg transition-all duration-200"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
