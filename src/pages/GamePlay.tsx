import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import GameBoard from "../components/game/GameBoard";
import BiddingInterface from "../components/game/BiddingInterface";
import TrumpSelectionInterface from "../components/game/TrumpSelectionInterface";
import StandaloneTrickConfirmation from "../components/game/StandaloneTrickConfirmation";
import DebugControls from "../components/game/DebugControls";
import { Trick } from "../models/game";

const GamePlay = () => {
  const navigate = useNavigate();
  const [showDebugControls, setShowDebugControls] = useState(false);

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
    addToHistory,
    startRound,
  } = useGameStore();

  // Redirect to setup if no game is initialized
  useEffect(() => {
    if (players.length === 0) {
      navigate("/setup");
      return;
    }

    // Debug log to see what's happening when the game loads
    console.log("GamePlay component loaded with:", {
      players,
      currentPhase,
      currentPlayerIndex,
      currentTrick,
      gameMode,
    });
  }, [
    players,
    navigate,
    currentPhase,
    currentPlayerIndex,
    currentTrick,
    gameMode,
  ]);

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

  // Make sure we have a properly initialized game, otherwise start a new one
  useEffect(() => {
    if (currentPhase === "setup" && players.length > 0) {
      console.log(
        "Game is in setup phase but players exist, starting the round"
      );
      // If we have players but still in setup phase, we need to start the round
      addToHistory("startRound", {});
      startRound();
    }
  }, [currentPhase, players, addToHistory, startRound]);

  // Current player information
  const currentPlayer = players[currentPlayerIndex] || {
    id: "",
    name: "Unknown",
    hand: [],
  };

  // Handle bid submission
  const handleBid = (amount: number | null, isHonors: boolean) => {
    // Record history before action
    addToHistory("processBid", {
      playerId: currentPlayer.id,
      amount,
      isHonors,
    });
    processBid(currentPlayer.id, amount, isHonors);
  };

  // Handle provisional trump selection
  const handleProvisionalTrumpSelect = (cardId: string) => {
    // Record history before action
    addToHistory("selectProvisionalTrump", {
      playerId: currentPlayer.id,
      cardId,
    });

    selectProvisionalTrump(currentPlayer.id, cardId);
  };

  // Handle final trump selection
  const handleFinalizeTrump = (
    keepProvisional: boolean,
    newTrumpCardId?: string
  ) => {
    // Record history before action
    addToHistory("finalizeTrump", {
      playerId: currentPlayer.id,
      keepProvisional,
      newTrumpCardId,
    });

    finalizeTrump(currentPlayer.id, keepProvisional, newTrumpCardId);
  };

  // Handle card play
  const handleCardPlay = (card: { id: string }) => {
    // Record history before action
    addToHistory("playCard", {
      playerId: currentPlayer.id,
      cardId: card.id,
    });

    playCard(currentPlayer.id, card.id);
  };

  // Handle trump reveal request
  const handleRequestTrumpReveal = () => {
    // Record history before action
    addToHistory("requestTrumpReveal", {});

    // Call the actual function and ensure we return a boolean
    const result = requestTrumpReveal();
    return result === true; // Explicitly check for true
  };

  // Handle trick confirmation
  const handleConfirmTrick = () => {
    // Record history before action
    addToHistory("confirmTrick", {});

    confirmTrick();
  };

  // Toggle debug controls
  const toggleDebugControls = () => {
    setShowDebugControls((prev) => !prev);
  };

  // Helper to determine current UI phase
  const isBiddingRound1 =
    currentPhase === "bidding1_start" ||
    currentPhase === "bidding1_in_progress";

  const isBiddingRound2 =
    currentPhase === "bidding2_start" ||
    currentPhase === "bidding2_in_progress";

  // Fix the newBiddingInRound2 calculation to ensure it's always a boolean
  const newBiddingInRound2 = !!(
    highestBid1 &&
    highestBid2 &&
    bids2.some((bid) => bid.amount !== null) &&
    highestBid1.playerId !== highestBid2.playerId
  );

  // Make sure to get the correct winner name
  const getWinnerName = (trick: Trick | undefined) => {
    if (!trick || !trick.winnerId) return "Unknown";
    const winner = players.find((p) => p.id === trick.winnerId);
    return winner?.name || "Unknown";
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

          <button
            type="button"
            onClick={toggleDebugControls}
            className={`${
              showDebugControls ? "bg-red-600" : "bg-purple-600"
            } text-white text-xs px-2 py-1 rounded`}
          >
            {showDebugControls ? "Hide Debug Controls" : "Show Debug Controls"}
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
          <div className="mb-4">
            <StandaloneTrickConfirmation
              trick={completedTrickAwaitingConfirmation}
              onConfirm={handleConfirmTrick}
              autoConfirmDelay={3000}
              winnerName={getWinnerName(completedTrickAwaitingConfirmation)}
            />
          </div>
        )}

      {/* Game board - shown during all relevant phases */}
      {(isBiddingRound1 ||
        isBiddingRound2 ||
        currentPhase === "playing_start_trick" ||
        currentPhase === "playing_in_progress" ||
        currentPhase === "trick_completed_awaiting_confirmation" ||
        // Include setup phase if players exist (for debugging)
        (currentPhase === "setup" && players.length > 0) ||
        currentPhase === "dealing1") && (
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

      {/* Debug controls */}
      <DebugControls visible={showDebugControls} />
    </div>
  );
};

export default GamePlay;
