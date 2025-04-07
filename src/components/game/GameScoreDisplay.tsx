import React from "react";
import { GameScore } from "../../models/game";
import { Player } from "../../models/player";

interface GameScoreDisplayProps {
  gameScores: GameScore;
  gameMode: "3p" | "4p";
  players: Player[];
  targetScore: number;
}

const GameScoreDisplay: React.FC<GameScoreDisplayProps> = ({
  gameScores,
  gameMode,
  players,
  targetScore,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-3 border border-slate-700 w-48">
      <h3 className="text-md font-bold text-slate-200 mb-2 pb-1 border-b border-slate-700">
        Game Score
      </h3>

      {gameMode === "3p" ? (
        // 3-player mode: individual scores
        <div className="space-y-1">
          {players.map((player, index) => {
            const scoreKey = `player${index + 1}Points` as keyof GameScore;
            const score = gameScores[scoreKey] || 0;
            const isNearTarget = score >= targetScore - 2;

            return (
              <div
                key={player.id}
                className={`flex justify-between items-center py-1 px-2 rounded-md ${
                  isNearTarget
                    ? "bg-yellow-800/30 border border-yellow-700/50"
                    : ""
                }`}
              >
                <div className="text-sm font-medium text-slate-300 truncate max-w-[90px]">
                  {player.name}
                </div>
                <div
                  className={`text-sm font-bold ${
                    isNearTarget ? "text-yellow-300" : "text-slate-200"
                  }`}
                >
                  {score} pts
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // 4-player mode: team scores
        <div className="space-y-1">
          <div className="flex justify-between items-center py-1 px-2 rounded-md">
            <div className="text-sm font-medium text-blue-300">Team 1</div>
            <div
              className={`text-sm font-bold ${
                (gameScores.team1Points || 0) >= targetScore - 2
                  ? "text-yellow-300"
                  : "text-slate-200"
              }`}
            >
              {gameScores.team1Points || 0} pts
            </div>
          </div>

          <div className="text-xs text-blue-200/60 px-2 mb-1">
            {players
              .filter((p) => p.team === 0)
              .map((p) => p.name)
              .join(" & ")}
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded-md">
            <div className="text-sm font-medium text-red-300">Team 2</div>
            <div
              className={`text-sm font-bold ${
                (gameScores.team2Points || 0) >= targetScore - 2
                  ? "text-yellow-300"
                  : "text-slate-200"
              }`}
            >
              {gameScores.team2Points || 0} pts
            </div>
          </div>

          <div className="text-xs text-red-200/60 px-2">
            {players
              .filter((p) => p.team === 1)
              .map((p) => p.name)
              .join(" & ")}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-slate-400 text-center">
        Target: {targetScore} pts
      </div>
    </div>
  );
};

export default GameScoreDisplay;
