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

  // Check if there was any actual bidding (non-pass bids) in round 2
  // If all bids in round 2 are passes, then there's no new bidding
  const newBiddingInRound2 = bids2.some((bid) => !bid.isPass);

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
    <div className="game-container">
      {/* Game phase indicator */}
      <div className="absolute top-4 left-4 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 rounded-lg shadow-lg px-4 py-2 border border-slate-700">
            <h2 className="text-lg font-bold text-slate-200">
              Round {roundNumber}
            </h2>
            <div className="text-sm text-slate-400 font-medium mt-1">
              {currentPhase === "bidding1_start" ||
              currentPhase === "bidding1_in_progress"
                ? "First Bidding Round"
                : currentPhase === "bidding2_start" ||
                  currentPhase === "bidding2_in_progress"
                ? "Second Bidding Round"
                : currentPhase === "trump_selection_provisional"
                ? "Selecting Provisional Trump"
                : currentPhase === "trump_selection_final"
                ? "Finalizing Trump"
                : currentPhase === "playing"
                ? "Playing Tricks"
                : currentPhase === "trick_completed_awaiting_confirmation"
                ? "Trick Completed"
                : currentPhase === "round_over"
                ? "Round Complete"
                : currentPhase === "game_over"
                ? "Game Over"
                : "Setting Up"}
            </div>
          </div>

          {/* Scores */}
          <div className="bg-slate-800 rounded-lg shadow-lg px-4 py-2 border border-slate-700">
            <h3 className="text-md font-medium text-slate-300">Round Score:</h3>
            <div className="text-sm font-medium mt-1">
              {Object.entries(roundScores).map(([playerId, score], index) => {
                const player = players.find((p) => p.id === playerId);
                return (
                  <div key={playerId} className="text-slate-200">
                    {player?.name}: {score} pts
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Debug controls toggle */}
      <button
        className="absolute top-4 right-4 bg-slate-800 px-3 py-1 rounded-md text-sm text-slate-300 hover:bg-slate-700 z-50"
        onClick={toggleDebugControls}
      >
        {showDebugControls ? "Hide Debug" : "Show Debug"}
      </button>

      {/* Debug controls */}
      {showDebugControls && (
        <div className="absolute top-16 right-4 z-50">
          <DebugControls />
        </div>
      )}

      {/* Main game board */}
      <div className="py-4 md:py-10">
        <GameBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          dealerIndex={dealerIndex}
          originalBidderIndex={originalBidderIndex}
          currentTrick={currentTrick}
          trumpState={trumpState}
          foldedCard={foldedCard}
          gameMode={gameMode}
          onCardPlay={handleCardPlay}
          onRequestTrumpReveal={handleRequestTrumpReveal}
          completedTrickAwaitingConfirmation={
            completedTrickAwaitingConfirmation
          }
          onConfirmTrick={handleConfirmTrick}
        />
      </div>

      {/* UI Overlays based on game phase */}
      {/* Bidding Interface */}
      {(isBiddingRound1 || isBiddingRound2) && (
        <BiddingInterface
          currentPlayerName={currentPlayer.name}
          highestBid={isBiddingRound2 ? highestBid2 : highestBid1}
          onBid={handleBid}
          gameMode={gameMode}
          currentPhase={currentPhase}
          round={isBiddingRound1 ? 1 : 2}
        />
      )}

      {/* Trump Selection Interface */}
      {(currentPhase === "trump_selection_provisional" ||
        currentPhase === "trump_selection_final" ||
        currentPhase === "bidding1_complete" ||
        currentPhase === "bidding2_complete") && (
        <TrumpSelectionInterface
          currentPlayerName={currentPlayer.name}
          currentPlayerHand={currentPlayer.hand}
          phase={
            currentPhase === "bidding1_complete" ||
            currentPhase === "trump_selection_provisional"
              ? "trump_selection_provisional"
              : "trump_selection_final"
          }
          highestBid1={highestBid1}
          highestBid2={highestBid2}
          newBiddingInRound2={newBiddingInRound2}
          foldedCard={foldedCard}
          trumpState={trumpState}
          onSelectProvisionalTrump={handleProvisionalTrumpSelect}
          onFinalizeTrump={handleFinalizeTrump}
        />
      )}

      {/* Trick Confirmation */}
      {currentPhase === "trick_completed_awaiting_confirmation" &&
        completedTrickAwaitingConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <StandaloneTrickConfirmation
              trick={completedTrickAwaitingConfirmation}
              onConfirm={handleConfirmTrick}
              winnerName={getWinnerName(completedTrickAwaitingConfirmation)}
            />
          </div>
        )}

      {/* Round Over UI */}
      {currentPhase === "round_over" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-slate-900 rounded-xl shadow-2xl p-6 max-w-md border border-indigo-600">
            <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Round {roundNumber} Complete
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-200 mb-2">
                  Round Results:
                </h3>
                <div className="space-y-2">
                  {Object.entries(roundScores).map(([playerId, score]) => {
                    const player = players.find((p) => p.id === playerId);
                    const isHighestScore =
                      score === Math.max(...Object.values(roundScores));

                    return (
                      <div
                        key={playerId}
                        className={`flex justify-between items-center p-2 rounded ${
                          isHighestScore
                            ? "bg-indigo-900/50 border border-indigo-500"
                            : "bg-slate-700/50"
                        }`}
                      >
                        <span className="font-medium text-slate-200">
                          {player?.name}
                        </span>
                        <span
                          className={`font-bold ${
                            isHighestScore
                              ? "text-indigo-300"
                              : "text-slate-300"
                          }`}
                        >
                          {score} points
                          {isHighestScore && " 🏆"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-200 mb-2">
                  Game Scores:
                </h3>
                <div className="space-y-2">
                  {Object.entries(gameScores).map(([playerId, score]) => {
                    const player = players.find((p) => p.id === playerId);
                    return (
                      <div
                        key={playerId}
                        className="flex justify-between items-center p-2 rounded bg-slate-700/50"
                      >
                        <span className="font-medium text-slate-200">
                          {player?.name}
                        </span>
                        <span className="font-bold text-slate-300">
                          {score} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleStartNewRound}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200"
            >
              Start Next Round
            </button>
          </div>
        </div>
      )}

      {/* Game Over UI */}
      {currentPhase === "game_over" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="bg-slate-900 rounded-xl shadow-2xl p-8 max-w-md border border-indigo-600">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <span className="text-6xl">🏆</span>
            </div>

            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Game Over!
            </h2>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-200 mb-3">
                  Final Scores:
                </h3>
                <div className="space-y-3">
                  {Object.entries(gameScores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([playerId, score], index) => {
                      const player = players.find((p) => p.id === playerId);
                      return (
                        <div
                          key={playerId}
                          className={`flex justify-between items-center p-3 rounded ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-600"
                              : "bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center">
                            {index === 0 && (
                              <span className="mr-2 text-xl">👑</span>
                            )}
                            <span className="font-medium text-slate-200">
                              {player?.name}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${
                              index === 0 ? "text-yellow-400" : "text-slate-300"
                            }`}
                          >
                            {score} points
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Main Menu
              </button>
              <button
                onClick={handleStartNewRound}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlay;
