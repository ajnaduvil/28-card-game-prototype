import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import GameBoard from "../components/game/GameBoard";
import BiddingInterface from "../components/game/BiddingInterface";
import TrumpSelectionInterface from "../components/game/TrumpSelectionInterface";

const GamePlay = () => {
  const navigate = useNavigate();
  const {
    players,
    gameMode,
    currentPhase,
    currentPlayerIndex,
    trumpState,
    currentTrick,
    highestBid1,
    highestBid2,
    foldedCard,
    processBid,
    selectProvisionalTrump,
    finalizeTrump,
    playCard,
    startGame,
  } = useGameStore();

  // Redirect to setup if no game is initialized
  useEffect(() => {
    if (players.length === 0) {
      navigate("/setup");
    }
  }, [players, navigate]);

  // Current player information
  const currentPlayer = players[currentPlayerIndex] || {
    id: "",
    name: "Unknown",
    hand: [],
  };

  // Handle bid submission
  const handleBid = (amount: number | null, isHonors: boolean) => {
    processBid(currentPlayer.id, amount, isHonors);
  };

  // Handle card play
  const handleCardPlay = (card: { id: string }) => {
    playCard(currentPlayer.id, card.id);
  };

  // Handle provisional trump selection
  const handleProvisionalTrumpSelect = (cardId: string) => {
    selectProvisionalTrump(cardId);
  };

  // Handle final trump selection
  const handleFinalizeTrump = (
    keepProvisional: boolean,
    newTrumpCardId?: string
  ) => {
    finalizeTrump(keepProvisional, newTrumpCardId);
  };

  // Determine current bidding round
  const isBiddingRound1 =
    currentPhase === "bidding1_start" ||
    currentPhase === "bidding1_in_progress";
  const isBiddingRound2 =
    currentPhase === "bidding2_start" ||
    currentPhase === "bidding2_in_progress";

  return (
    <div className="min-h-screen bg-green-900 p-4">
      <div className="bg-green-800 rounded-lg p-4 mb-4 text-white">
        <h1 className="text-xl font-bold mb-2">28 Card Game</h1>
        <div className="flex justify-between text-sm">
          <div>Mode: {gameMode}</div>
          <div>Phase: {currentPhase}</div>
          <div>Current Player: {currentPlayer.name}</div>
        </div>
      </div>

      {/* Game setup state */}
      {currentPhase === "setup" && (
        <div className="grid place-items-center h-[calc(100vh-150px)]">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">Ready to Start</h2>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Bidding phases */}
      {(isBiddingRound1 || isBiddingRound2) && (
        <div className="flex flex-col items-center">
          {/* Game board in the background */}
          <div className="w-full">
            <GameBoard
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              currentTrick={currentTrick}
              trumpState={trumpState}
              onCardPlay={handleCardPlay}
              gameMode={gameMode}
            />
          </div>

          {/* Bidding interface in the foreground */}
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-full max-w-lg">
            <BiddingInterface
              currentPlayerName={currentPlayer.name}
              highestBid={
                isBiddingRound1 ? highestBid1 || null : highestBid2 || null
              }
              onBid={handleBid}
              gameMode={gameMode}
              currentPhase={currentPhase}
              round={isBiddingRound1 ? 1 : 2}
            />
          </div>
        </div>
      )}

      {/* Trump selection phases */}
      {(currentPhase === "bidding1_complete" ||
        currentPhase === "bidding2_complete") && (
        <div className="flex flex-col items-center">
          {/* Game board in the background */}
          <div className="w-full opacity-50">
            <GameBoard
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              currentTrick={currentTrick}
              trumpState={trumpState}
              onCardPlay={handleCardPlay}
              gameMode={gameMode}
            />
          </div>

          {/* Trump selection interface in the foreground */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
            <TrumpSelectionInterface
              playerHand={currentPlayer.hand}
              onSelectProvisionalTrump={
                currentPhase === "bidding1_complete"
                  ? handleProvisionalTrumpSelect
                  : undefined
              }
              onFinalizeTrump={
                currentPhase === "bidding2_complete"
                  ? handleFinalizeTrump
                  : undefined
              }
              trumpState={trumpState}
              foldedCard={foldedCard}
              currentPhase={currentPhase}
              playerName={currentPlayer.name}
            />
          </div>
        </div>
      )}

      {/* Playing phases */}
      {(currentPhase === "playing_start_trick" ||
        currentPhase === "playing_in_progress") && (
        <div className="w-full">
          <GameBoard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            currentTrick={currentTrick}
            trumpState={trumpState}
            onCardPlay={handleCardPlay}
            gameMode={gameMode}
          />
        </div>
      )}

      {/* Round over */}
      {currentPhase === "round_over" && (
        <div className="grid place-items-center h-[calc(100vh-150px)]">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">Round Complete</h2>
            <p className="mb-6">
              The round has ended. Round summary will be displayed here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
