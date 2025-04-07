import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import GameBoard from "../components/game/GameBoard";
import BiddingInterface from "../components/game/BiddingInterface";
import TrumpSelectionInterface from "../components/game/TrumpSelectionInterface";
import StandaloneTrickConfirmation from "../components/game/StandaloneTrickConfirmation";

const GamePlay = () => {
  const navigate = useNavigate();
  const {
    players,
    gameMode,
    currentPhase,
    currentPlayerIndex,
    dealerIndex,
    originalBidderIndex,
    trumpState,
    currentTrick,
    completedTrickAwaitingConfirmation,
    highestBid1,
    highestBid2,
    bids2,
    foldedCard,
    processBid,
    selectProvisionalTrump,
    finalizeTrump,
    playCard,
    requestTrumpReveal,
    confirmTrick,
    startGame,
  } = useGameStore();

  // Redirect to setup if no game is initialized
  useEffect(() => {
    if (players.length === 0) {
      navigate("/setup");
    }
  }, [players, navigate]);

  // Log when game phase changes
  useEffect(() => {
    console.log(`GamePlay: Phase changed to ${currentPhase}`);

    if (currentPhase === "trick_completed_awaiting_confirmation") {
      console.log(
        "Trick awaiting confirmation:",
        completedTrickAwaitingConfirmation
      );
    }
  }, [currentPhase, completedTrickAwaitingConfirmation]);

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

  // Handle trump reveal request
  const handleRequestTrumpReveal = () => {
    return requestTrumpReveal();
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

  // Check if there was new bidding in round 2
  // If there are bids in round 2 that are not passes, then there was new bidding
  const newBiddingInRound2 = bids2 && bids2.some((bid) => !bid.isPass);

  // Handle trick confirmation
  const handleConfirmTrick = () => {
    // Validate we're in the right state
    if (
      currentPhase !== "trick_completed_awaiting_confirmation" ||
      !completedTrickAwaitingConfirmation
    ) {
      console.error("Cannot confirm trick - not in the right state");
      return;
    }

    // Call the store action to confirm the trick
    confirmTrick();
  };

  return (
    <div className="min-h-screen bg-green-900 p-4">
      <div className="bg-green-800 rounded-lg p-4 mb-4 text-white">
        <h1 className="text-xl font-bold mb-2">28 Card Game</h1>
        <div className="flex justify-between text-sm">
          <div>Mode: {gameMode}</div>
          <div>Phase: {currentPhase}</div>
          <div>Current Player: {currentPlayer.name}</div>
        </div>

        {/* Debug buttons and phase indicator */}
        <div className="mt-2 flex gap-2 items-center">
          <button
            type="button"
            onClick={() => {
              console.log("Debug - Game State:", {
                currentPhase,
                completedTrickAwaitingConfirmation,
                currentTrick,
                players,
              });
            }}
            className="bg-purple-600 text-white text-xs px-2 py-1 rounded"
          >
            Debug State
          </button>

          {currentPhase === "trick_completed_awaiting_confirmation" && (
            <button
              type="button"
              onClick={handleConfirmTrick}
              className="bg-red-600 text-white text-xs px-2 py-1 rounded"
            >
              Force Confirm Trick
            </button>
          )}

          {/* Phase indicator */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs">Phase:</span>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {currentPhase}
            </span>
          </div>
        </div>
      </div>

      {/* Standalone trick confirmation UI - ALWAYS SHOWN when a trick is completed */}
      {currentPhase === "trick_completed_awaiting_confirmation" &&
        completedTrickAwaitingConfirmation && (
          <StandaloneTrickConfirmation
            trick={completedTrickAwaitingConfirmation}
            onConfirm={handleConfirmTrick}
            autoConfirmDelay={5000} // 5 seconds for better visibility
            winnerName={
              players.find(
                (p) => p.id === completedTrickAwaitingConfirmation.winnerId
              )?.name || "Unknown"
            }
          />
        )}

      {/* Game setup state */}
      {currentPhase === "setup" && (
        <div className="grid place-items-center h-[calc(100vh-150px)]">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">Ready to Start</h2>
            <button
              type="button"
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game board for bidding and playing phases */}
      {(isBiddingRound1 ||
        isBiddingRound2 ||
        currentPhase === "playing_start_trick" ||
        currentPhase === "playing_in_progress" ||
        currentPhase === "trick_completed_awaiting_confirmation") && (
        <div className="w-full">
          <GameBoard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            dealerIndex={dealerIndex}
            originalBidderIndex={originalBidderIndex}
            currentTrick={currentTrick}
            trumpState={trumpState}
            foldedCard={foldedCard}
            onCardPlay={handleCardPlay}
            onRequestTrumpReveal={handleRequestTrumpReveal}
            gameMode={gameMode}
            completedTrickAwaitingConfirmation={
              completedTrickAwaitingConfirmation
            }
            onConfirmTrick={handleConfirmTrick}
          />
        </div>
      )}

      {/* Floating draggable bidding interface */}
      {(isBiddingRound1 || isBiddingRound2) && (
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
              dealerIndex={dealerIndex}
              originalBidderIndex={originalBidderIndex}
              currentTrick={currentTrick}
              trumpState={trumpState}
              foldedCard={foldedCard}
              onCardPlay={handleCardPlay}
              onRequestTrumpReveal={handleRequestTrumpReveal}
              gameMode={gameMode}
              completedTrickAwaitingConfirmation={
                completedTrickAwaitingConfirmation
              }
              onConfirmTrick={handleConfirmTrick}
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
              newBiddingInRound2={newBiddingInRound2}
            />
          </div>
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
              type="button"
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
