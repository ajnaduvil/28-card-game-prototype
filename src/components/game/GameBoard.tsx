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
    return teamIndex === 0 ? "border-team-a" : "border-team-b";
  };

  // Create a map of player IDs to their positions for the PlayArea
  const playerPositions: Record<string, string> = {};
  players.forEach((player, index) => {
    playerPositions[player.id] = getPlayerPosition(index);
  });

  // Add debug logging
  React.useEffect(() => {
    console.log("GameBoard rendering with props:", {
      playersCount: players?.length,
      currentPlayerIndex,
      currentTrick,
      trumpState,
      gameMode,
      completedTrick: completedTrickAwaitingConfirmation ? "present" : "none",
    });
  }, [
    players,
    currentPlayerIndex,
    currentTrick,
    trumpState,
    gameMode,
    completedTrickAwaitingConfirmation,
  ]);

  return (
    <div className="game-board w-full max-w-7xl h-[700px] mx-auto">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-pattern-diamonds bg-repeat opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/70"></div>
      </div>

      {/* Play area in the center */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
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
            className={`player-area absolute transition-all duration-300 ${
              position === "bottom"
                ? "bottom-4 left-1/2 -translate-x-1/2 w-[480px]"
                : position === "top"
                ? "top-4 left-1/2 -translate-x-1/2 w-[480px] rotate-180"
                : position === "left"
                ? "left-4 top-1/2 -translate-y-1/2 w-[480px] rotate-270"
                : position === "right"
                ? "right-4 top-1/2 -translate-y-1/2 w-[480px] rotate-90"
                : position === "top-left"
                ? "top-10 left-16 w-[460px] -rotate-25"
                : "top-10 right-16 w-[460px] rotate-25" // top-right
            } ${isCurrentPlayer ? "z-20" : "z-10"}`}
          >
            {/* Current player turn highlight */}
            {isCurrentPlayer && (
              <div className="absolute inset-0 -m-1 rounded-xl pointer-events-none z-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse opacity-50"></div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 blur-md animate-pulse opacity-30"></div>
              </div>
            )}

            <div
              className={`player-info ${
                isCurrentPlayer ? "active" : ""
              } ${teamColor}`}
            >
              <div className="flex items-center gap-1">
                {/* Player avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium text-sm overflow-hidden">
                  {player.name.charAt(0).toUpperCase()}
                </div>

                <span className="font-medium">{player.name}</span>

                {/* Role badges */}
                <div className="flex gap-1 ml-1">
                  {isDealer && <span className="dealer-badge">D</span>}
                  {isOriginalBidder && <span className="bidder-badge">B</span>}
                  {isDeclarer && <span className="declarer-badge">TD</span>}
                </div>
              </div>

              {isCurrentPlayer && (
                <span className="text-yellow-300 font-medium animate-pulse">
                  Your Turn
                </span>
              )}
            </div>

            {/* Player's folded trump card area */}
            {isDeclarer && (
              <div className="absolute left-4 bottom-16 bg-slate-800 bg-opacity-90 rounded-lg p-2 shadow-lg border border-yellow-400 z-10">
                <div className="text-xs text-white mb-1 text-center font-medium">
                  {trumpState.trumpRevealed ? "Revealed Trump" : "Folded Trump"}
                </div>
                {trumpState.trumpRevealed && foldedCard ? (
                  // If revealed, show the actual folded card
                  <Card card={foldedCard} size="sm" isSelectable={false} />
                ) : (
                  // Otherwise, show the placeholder
                  <div className="w-14 h-20 bg-indigo-900 rounded-lg border-2 border-yellow-400 flex items-center justify-center rotate-3 shadow-lg">
                    <span className="text-2xl">🃏</span>
                  </div>
                )}
              </div>
            )}

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
        <div className="trump-indicator top-4 right-4 z-30">
          <span className="font-bold">Trump:</span>
          <span
            className={`font-medium ${
              trumpState.finalTrumpSuit === "Hearts" ||
              trumpState.finalTrumpSuit === "Diamonds"
                ? "text-red-500"
                : "text-blue-400"
            }`}
          >
            {trumpState.finalTrumpSuit}
          </span>
          <span className="text-lg ml-1">
            {trumpState.finalTrumpSuit === "Hearts"
              ? "♥"
              : trumpState.finalTrumpSuit === "Diamonds"
              ? "♦"
              : trumpState.finalTrumpSuit === "Clubs"
              ? "♣"
              : "♠"}
          </span>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
