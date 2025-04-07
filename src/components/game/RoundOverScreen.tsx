import React from "react";
import { GameScore, RoundScore, TrumpState } from "../../models/game";
import { Player } from "../../models/player";

interface RoundOverScreenProps {
  roundNumber: number;
  latestRoundScore: RoundScore;
  gameScores: GameScore;
  gameMode: "3p" | "4p";
  players: Player[];
  trumpState: TrumpState;
  onStartNextRound: () => void;
}

const RoundOverScreen: React.FC<RoundOverScreenProps> = ({
  roundNumber,
  latestRoundScore,
  gameScores,
  gameMode,
  players,
  trumpState,
  onStartNextRound,
}) => {
  // Find the declarer (player who made the final bid)
  const declarerIndex = players.findIndex(
    (p) => p.id === trumpState.finalDeclarerId
  );
  const declarer = players[declarerIndex];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-slate-900 rounded-xl shadow-2xl p-6 max-w-md border border-indigo-600">
        <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Round {roundNumber} Complete
        </h2>

        {/* Contract information */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-300">Contract:</span>
            <span className="font-bold text-white">
              {latestRoundScore.contract} points
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300">Result:</span>
            <span
              className={`font-bold ${
                latestRoundScore.declarerWon ? "text-green-400" : "text-red-400"
              }`}
            >
              {latestRoundScore.declarerWon ? "Made" : "Failed"}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-slate-300">Declarer:</span>
            <span className="font-bold text-white">
              {declarer?.name || "Unknown"}
            </span>
          </div>

          {/* Show if it was honors */}
          {latestRoundScore.isHonors && (
            <div className="mt-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-yellow-400 text-sm inline-block">
              Honors
            </div>
          )}

          {/* Show if it was round 1 or round 2 bid */}
          <div className="mt-2 px-3 py-1 bg-slate-700/30 border border-slate-600/50 rounded-md text-slate-300 text-sm inline-block">
            {latestRoundScore.bid2Amount ? "Round 2 Bid" : "Round 1 Bid"}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Card Points */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Card Points:
            </h3>
            <div className="space-y-2">
              {/* For 4p mode - show team results */}
              {gameMode === "4p" && (
                <>
                  <div
                    className={`flex justify-between items-center p-2 rounded ${
                      latestRoundScore.declarerWon
                        ? "bg-green-900/30 border border-green-700"
                        : "bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium text-slate-200">
                      Declarer's Team
                    </span>
                    <span
                      className={`font-bold ${
                        latestRoundScore.declarerWon
                          ? "text-green-300"
                          : "text-slate-300"
                      }`}
                    >
                      {latestRoundScore.declarerPoints} points
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center p-2 rounded ${
                      !latestRoundScore.declarerWon
                        ? "bg-green-900/30 border border-green-700"
                        : "bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium text-slate-200">
                      Opposing Team
                    </span>
                    <span
                      className={`font-bold ${
                        !latestRoundScore.declarerWon
                          ? "text-green-300"
                          : "text-slate-300"
                      }`}
                    >
                      {latestRoundScore.opponentPoints} points
                    </span>
                  </div>
                </>
              )}

              {/* For 3p mode - show declarer vs alliance */}
              {gameMode === "3p" && (
                <>
                  <div
                    className={`flex justify-between items-center p-2 rounded ${
                      latestRoundScore.declarerWon
                        ? "bg-green-900/30 border border-green-700"
                        : "bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium text-slate-200">
                      Declarer ({declarer?.name})
                    </span>
                    <span
                      className={`font-bold ${
                        latestRoundScore.declarerWon
                          ? "text-green-300"
                          : "text-slate-300"
                      }`}
                    >
                      {latestRoundScore.declarerPoints} points
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center p-2 rounded ${
                      !latestRoundScore.declarerWon
                        ? "bg-green-900/30 border border-green-700"
                        : "bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium text-slate-200">
                      Opponents
                    </span>
                    <span
                      className={`font-bold ${
                        !latestRoundScore.declarerWon
                          ? "text-green-300"
                          : "text-slate-300"
                      }`}
                    >
                      {latestRoundScore.opponentPoints} points
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Game Points Awarded */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Game Points Change:
            </h3>
            <div className="p-2 rounded bg-indigo-900/30 border border-indigo-700 text-center">
              <span className="font-bold text-xl text-indigo-300">
                {latestRoundScore.gamePointsChange > 0 ? "+" : ""}
                {latestRoundScore.gamePointsChange} points
              </span>
              <div className="text-xs text-slate-400 mt-1">
                {latestRoundScore.declarerWon ? "to declarer" : "to opponents"}
              </div>
            </div>
          </div>

          {/* Updated Game Scores */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
              Game Score:
            </h3>
            <div className="space-y-2">
              {/* For 4p mode - team scores */}
              {gameMode === "4p" && (
                <>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-700/50">
                    <span className="font-medium text-slate-200">Team 1</span>
                    <span className="font-bold text-slate-300">
                      {gameScores.team1Points} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-700/50">
                    <span className="font-medium text-slate-200">Team 2</span>
                    <span className="font-bold text-slate-300">
                      {gameScores.team2Points} pts
                    </span>
                  </div>
                </>
              )}

              {/* For 3p mode - individual scores */}
              {gameMode === "3p" && (
                <>
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center p-2 rounded bg-slate-700/50"
                    >
                      <span className="font-medium text-slate-200">
                        {player.name}
                      </span>
                      <span className="font-bold text-slate-300">
                        {
                          gameScores[
                            `player${index + 1}Points` as keyof GameScore
                          ]
                        }{" "}
                        pts
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onStartNextRound}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200"
        >
          Start Next Round
        </button>
      </div>
    </div>
  );
};

export default RoundOverScreen;
