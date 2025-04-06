import React from "react";
import { Player } from "../../models/player";
import { Trick, TrumpState } from "../../models/game";
import PlayerHand from "./PlayerHand";
import PlayArea from "./PlayArea";
import { Card as CardModel } from "../../models/card";

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  currentTrick: Trick | null;
  trumpState: TrumpState;
  onCardPlay: (card: CardModel) => void;
  gameMode: "3p" | "4p";
}

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerIndex,
  currentTrick,
  trumpState,
  onCardPlay,
  gameMode,
}) => {
  // Calculate positions based on game mode
  const getPlayerPosition = (playerIndex: number) => {
    const currentUserIndex = 0; // Assuming current user is always at bottom position

    if (gameMode === "3p") {
      switch ((playerIndex - currentUserIndex + 3) % 3) {
        case 0:
          return "bottom"; // Current user
        case 1:
          return "top-right";
        case 2:
          return "top-left";
        default:
          return "bottom";
      }
    } else {
      // 4p mode
      switch ((playerIndex - currentUserIndex + 4) % 4) {
        case 0:
          return "bottom";
        case 1:
          return "right";
        case 2:
          return "top";
        case 3:
          return "left";
        default:
          return "bottom";
      }
    }
  };

  return (
    <div className="game-board relative bg-green-800 rounded-xl shadow-lg w-full max-w-4xl h-[600px] mx-auto overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/src/assets/images/card-table-bg.jpg')] bg-cover" />

      {/* Play area in the center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayArea currentTrick={currentTrick} trumpState={trumpState} />
      </div>

      {/* Position players around the table */}
      {players.map((player, index) => {
        const position = getPlayerPosition(index);
        const isCurrentPlayer = index === currentPlayerIndex;

        return (
          <div
            key={player.id}
            className={`absolute transition-all duration-300 ${
              position === "bottom"
                ? "bottom-2 left-1/2 -translate-x-1/2 w-80"
                : position === "top"
                ? "top-2 left-1/2 -translate-x-1/2 w-80 rotate-180"
                : position === "left"
                ? "left-2 top-1/2 -translate-y-1/2 w-80 -rotate-90"
                : position === "right"
                ? "right-2 top-1/2 -translate-y-1/2 w-80 rotate-90"
                : position === "top-left"
                ? "top-6 left-6 w-80 -rotate-30"
                : "top-6 right-6 w-80 rotate-30" // top-right
            } ${isCurrentPlayer ? "z-10" : "z-0"}`}
          >
            <div
              className={`player-info mb-2 text-white flex items-center justify-between px-2 ${
                isCurrentPlayer ? "bg-blue-600 rounded-md" : ""
              }`}
            >
              <span>
                {player.name}
                {player.isDealer ? " (Dealer)" : ""}
              </span>
              {isCurrentPlayer && (
                <span className="text-yellow-300">• Your Turn</span>
              )}
            </div>

            <PlayerHand
              hand={player.hand}
              isCurrentPlayer={isCurrentPlayer}
              onCardPlay={isCurrentPlayer ? onCardPlay : undefined}
              currentTrick={currentTrick}
              trumpState={trumpState}
              playerId={player.id}
              finalDeclarerId={trumpState.finalDeclarerId}
            />
          </div>
        );
      })}

      {/* Trump indicator */}
      {trumpState.trumpRevealed && trumpState.finalTrumpSuit && (
        <div className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-md p-2 shadow-md">
          <span className="font-bold">Trump: </span>
          <span
            className={`${
              trumpState.finalTrumpSuit === "Hearts" ||
              trumpState.finalTrumpSuit === "Diamonds"
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {trumpState.finalTrumpSuit}
          </span>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
