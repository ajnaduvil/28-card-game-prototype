import React from "react";
import { Player } from "../../models/player";
import { Trick, TrumpState } from "../../models/game";
import PlayerHand from "./PlayerHand";
import PlayArea from "./PlayArea";
import { Card as CardModel } from "../../models/card";
import Card from "./Card";

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number;
  originalBidderIndex: number;
  currentTrick: Trick | null;
  trumpState: TrumpState;
  foldedCard?: CardModel | null;
  gameMode: "3p" | "4p";
  onCardPlay?: (card: { id: string }) => void;
  onRequestTrumpReveal?: () => boolean;
  completedTrickAwaitingConfirmation?: Trick | null;
  onConfirmTrick?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayerIndex,
  dealerIndex,
  originalBidderIndex,
  currentTrick,
  trumpState,
  foldedCard,
  gameMode,
  onCardPlay,
  onRequestTrumpReveal,
  completedTrickAwaitingConfirmation,
  onConfirmTrick,
}) => {
  // State to store the trick we should display
  // const [displayTrick, setDisplayTrick] = useState<Trick | null>(null); // Removed state

  /* // Removed function entirely
  const handleCardPlay = (card: CardModel) => {
    ...
  };
  */

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

  // Determine the team/partnership color for 4p mode
  const getTeamColor = (playerIndex: number) => {
    if (gameMode !== "4p") return "";

    // In 4p mode, players 0,2 are team 0 and players 1,3 are team 1
    const teamIndex = playerIndex % 2;
    return teamIndex === 0 ? "border-blue-500" : "border-red-500";
  };

  // Create a map of player IDs to their positions for the PlayArea
  const playerPositions: Record<string, string> = {};
  players.forEach((player, index) => {
    playerPositions[player.id] = getPlayerPosition(index);
  });

  return (
    <div className="game-board relative bg-gray-900 rounded-xl shadow-lg w-full max-w-5xl h-[700px] mx-auto overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/src/assets/images/card-table-bg.jpg')] bg-cover" />

      {/* Play area in the center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayArea
          currentTrick={currentTrick}
          playerPositions={playerPositions}
          completedTrick={completedTrickAwaitingConfirmation}
          onConfirmTrick={onConfirmTrick}
          players={players}
        />
      </div>

      {/* Position players around the table */}
      {players.map((player, index) => {
        const position = getPlayerPosition(index);
        const isCurrentPlayer = index === currentPlayerIndex;
        const isDealer = index === dealerIndex;
        const isOriginalBidder = index === originalBidderIndex;
        const isDeclarer = player.id === trumpState.finalDeclarerId;
        const teamColor = getTeamColor(index);

        return (
          <div
            key={player.id}
            className={`absolute transition-all duration-300 ${
              position === "bottom"
                ? "bottom-2 left-1/2 -translate-x-1/2 w-96"
                : position === "top"
                ? "top-2 left-1/2 -translate-x-1/2 w-96 rotate-180"
                : position === "left"
                ? "left-2 top-1/2 -translate-y-1/2 w-96 -rotate-90"
                : position === "right"
                ? "right-2 top-1/2 -translate-y-1/2 w-96 rotate-90"
                : position === "top-left"
                ? "top-6 left-6 w-96 -rotate-30"
                : "top-6 right-6 w-96 rotate-30" // top-right
            } ${isCurrentPlayer ? "z-10" : "z-0"}`}
          >
            {/* Current player turn highlight */}
            {isCurrentPlayer && (
              <div className="absolute inset-0 -m-2 border-4 border-yellow-400 rounded-xl animate-pulse opacity-70 pointer-events-none"></div>
            )}

            <div
              className={`player-info mb-2 text-white flex items-center justify-between px-2 rounded-md border-2 ${
                isCurrentPlayer
                  ? "bg-blue-900 border-yellow-400 shadow-lg"
                  : "bg-gray-800 bg-opacity-70"
              } ${teamColor}`}
            >
              <span className="flex items-center gap-1">
                {player.name}
                {isDealer && (
                  <span className="text-xs bg-yellow-600 px-1 rounded ml-1">
                    D
                  </span>
                )}
                {isOriginalBidder && (
                  <span className="text-xs bg-purple-600 px-1 rounded ml-1">
                    B
                  </span>
                )}
                {isDeclarer && (
                  <span className="text-xs bg-red-600 px-1 rounded ml-1">
                    Declarer
                  </span>
                )}
              </span>
              {isCurrentPlayer && (
                <span className="text-yellow-300 font-bold animate-pulse">
                  • Your Turn
                </span>
              )}
            </div>

            {/* Player's folded trump card area */}
            {isDeclarer && (
              <div className="absolute left-0 bottom-16 bg-black bg-opacity-70 rounded-md p-2 shadow-lg border border-yellow-500 z-10">
                <div className="text-xs text-white mb-1 text-center">
                  {trumpState.trumpRevealed ? "Revealed Trump" : "Folded Trump"}
                </div>
                {trumpState.trumpRevealed && foldedCard ? (
                  // If revealed, show the actual folded card
                  <Card card={foldedCard} size="sm" isSelectable={false} />
                ) : (
                  // Otherwise, show the placeholder
                  <div className="w-12 h-16 bg-gray-800 rounded-md border-2 border-yellow-500 flex items-center justify-center rotate-12 shadow-md">
                    <span className="text-lg">🃏</span>
                  </div>
                )}
              </div>
            )}

            {/* Log props before rendering PlayerHand */}
            {(() => {
              console.log(
                `GameBoard rendering PlayerHand for player index=${index}, id=${player.id}, name=${player.name}. finalDeclarerId=${trumpState.finalDeclarerId}`
              );
              return null; // Prevent console.log from returning void in JSX
            })()}

            <PlayerHand
              hand={player.hand}
              isCurrentPlayer={index === currentPlayerIndex}
              currentTrick={currentTrick}
              trumpState={trumpState}
              playerId={player.id}
              finalDeclarerId={trumpState.finalDeclarerId}
              hideCards={index !== 0 && index !== currentPlayerIndex} // For local testing: show user's cards (index 0) and current player's cards
            />
          </div>
        );
      })}

      {/* Trump indicator */}
      {trumpState.trumpRevealed && trumpState.finalTrumpSuit && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-80 rounded-md p-2 shadow-md text-white">
          <span className="font-bold">Trump: </span>
          <span
            className={`${
              trumpState.finalTrumpSuit === "Hearts" ||
              trumpState.finalTrumpSuit === "Diamonds"
                ? "text-red-500"
                : "text-blue-300"
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
