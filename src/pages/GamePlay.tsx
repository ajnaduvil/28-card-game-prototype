import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import GameBoard from "../components/game/GameBoard";
import BiddingInterface from "../components/game/BiddingInterface";
import TrumpSelectionInterface from "../components/game/TrumpSelectionInterface";
import StandaloneTrickConfirmation from "../components/game/StandaloneTrickConfirmation";
import DebugControls from "../components/game/DebugControls";
import { Trick } from "../models/game";
import RoundOverScreen from "../components/game/RoundOverScreen";
import GameScoreDisplay from "../components/game/GameScoreDisplay";

const GamePlay = () => {
  const navigate = useNavigate();
  const [showDebugControls, setShowDebugControls] = useState(false);
  const [trickCount, setTrickCount] = useState(0);

  const {
    players,
    gameMode,
    currentPhase,
    currentPlayerIndex,
    dealerIndex,
    originalBidderIndex,
    trumpState,
    currentTrick,
    completedTricks,
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
    targetScore,
  } = useGameStore();

  // Get the latest round score
  const latestRoundScore =
    roundScores.length > 0 ? roundScores[roundScores.length - 1] : null;

  // Update trick count to trigger UI refresh when tricks are completed
  useEffect(() => {
    setTrickCount(completedTricks.length);
    console.log(`Trick count updated: ${completedTricks.length}`);
  }, [completedTricks.length]);

  // Handle trick confirmation with UI refresh
  const handleConfirmTrick = useCallback(() => {
    // Record history before action
    addToHistory("confirmTrick", {});
    confirmTrick();
    // Force immediate UI refresh to show updated scores
    setTrickCount((prev) => prev + 1);
  }, [addToHistory, confirmTrick]);

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
      completedTricks: completedTricks.length,
      trickCount,
    });
  }, [
    players,
    navigate,
    currentPhase,
    currentPlayerIndex,
    currentTrick,
    gameMode,
    completedTricks.length,
    trickCount,
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
                : currentPhase === "playing_start_trick" ||
                  currentPhase === "playing_in_progress"
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

          {/* Game Score Display */}
          <GameScoreDisplay
            gameScores={gameScores}
            gameMode={gameMode}
            players={players}
            targetScore={targetScore}
          />
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
          highestBid={
            isBiddingRound2 ? highestBid2 || null : highestBid1 || null
          }
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
            <StandaloneTrickConfirmation
              trick={completedTrickAwaitingConfirmation}
              onConfirm={handleConfirmTrick}
              winnerName={getWinnerName(completedTrickAwaitingConfirmation)}
            />
          </div>
        )}

      {/* Round Over UI */}
      {currentPhase === "round_over" && latestRoundScore && (
        <RoundOverScreen
          roundNumber={roundNumber}
          latestRoundScore={latestRoundScore}
          gameScores={gameScores}
          gameMode={gameMode}
          players={players}
          trumpState={trumpState}
          onStartNextRound={handleStartNewRound}
        />
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
                {gameMode === "4p" ? (
                  // Display team scores for 4p mode
                  <div className="space-y-2">
                    <div
                      className={`flex justify-between items-center p-3 rounded ${
                        (gameScores.team1Points || 0) >
                        (gameScores.team2Points || 0)
                          ? "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-600"
                          : "bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center">
                        {(gameScores.team1Points || 0) >
                          (gameScores.team2Points || 0) && (
                          <span className="mr-2 text-xl">👑</span>
                        )}
                        <span className="font-medium text-slate-200">
                          Team 1 -{" "}
                          {players
                            .filter((p) => p.team === 0)
                            .map((p) => p.name)
                            .join(" & ")}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          (gameScores.team1Points || 0) >
                          (gameScores.team2Points || 0)
                            ? "text-yellow-400"
                            : "text-slate-300"
                        }`}
                      >
                        {gameScores.team1Points} points
                      </span>
                    </div>

                    <div
                      className={`flex justify-between items-center p-3 rounded ${
                        (gameScores.team2Points || 0) >
                        (gameScores.team1Points || 0)
                          ? "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-600"
                          : "bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center">
                        {(gameScores.team2Points || 0) >
                          (gameScores.team1Points || 0) && (
                          <span className="mr-2 text-xl">👑</span>
                        )}
                        <span className="font-medium text-slate-200">
                          Team 2 -{" "}
                          {players
                            .filter((p) => p.team === 1)
                            .map((p) => p.name)
                            .join(" & ")}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          (gameScores.team2Points || 0) >
                          (gameScores.team1Points || 0)
                            ? "text-yellow-400"
                            : "text-slate-300"
                        }`}
                      >
                        {gameScores.team2Points} points
                      </span>
                    </div>
                  </div>
                ) : (
                  // Display individual scores for 3p mode
                  <div className="space-y-2">
                    {players
                      .map((player, index) => ({
                        player,
                        score: gameScores[
                          `player${index + 1}Points` as keyof typeof gameScores
                        ] as number,
                      }))
                      .sort((a, b) => b.score - a.score)
                      .map(({ player, score }, index) => (
                        <div
                          key={player.id}
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
                              {player.name}
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
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
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
