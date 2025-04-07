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
    roundScores,
    gameScores,
    roundNumber,
    startNewRound,
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

  // Add handler for starting new round
  const handleStartNewRound = () => {
    // Record history before action
    addToHistory("startNewRound", {});
    startNewRound();
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

      {/* Add round over screen UI */}
      {currentPhase === "round_over" && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40 flex items-center justify-center">
          <div className="bg-green-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Round {roundNumber} Complete
            </h2>

            {/* Latest round score */}
            {roundScores.length > 0 && (
              <div className="mb-6 bg-green-900 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">Round Result</h3>
                <div className="text-white">
                  <p>
                    Contract: {roundScores[roundScores.length - 1].contract}
                  </p>
                  <p>
                    {roundScores[roundScores.length - 1].declarerWon ? (
                      <span className="text-green-400">Declarer won!</span>
                    ) : (
                      <span className="text-red-400">Declarer lost!</span>
                    )}
                  </p>
                  <p>
                    Points: {roundScores[roundScores.length - 1].declarerPoints}{" "}
                    / {roundScores[roundScores.length - 1].opponentPoints}
                  </p>
                  <p>
                    Game Points:{" "}
                    {roundScores[roundScores.length - 1].gamePointsChange}
                  </p>
                </div>
              </div>
            )}

            {/* Current game score */}
            <div className="mb-6 bg-green-900 p-4 rounded-lg">
              <h3 className="text-xl text-white mb-2">Game Score</h3>
              {gameMode === "4p" ? (
                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <p className="font-bold text-blue-400">Team 1</p>
                    <p>{gameScores.team1Points} points</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-400">Team 2</p>
                    <p>{gameScores.team2Points} points</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div>
                    <p className="font-bold">{players[0]?.name}</p>
                    <p>{gameScores.player1Points} points</p>
                  </div>
                  <div>
                    <p className="font-bold">{players[1]?.name}</p>
                    <p>{gameScores.player2Points} points</p>
                  </div>
                  <div>
                    <p className="font-bold">{players[2]?.name}</p>
                    <p>{gameScores.player3Points} points</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStartNewRound}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
              >
                Start Next Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
