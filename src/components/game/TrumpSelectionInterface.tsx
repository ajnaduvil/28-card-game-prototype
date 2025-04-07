import React, { useState, useEffect } from "react";
import { Card as CardModel } from "../../models/card";
import Card from "./Card";
import { Bid } from "../../models/bid";

interface TrumpSelectionInterfaceProps {
  currentPlayerName: string;
  currentPlayerHand: CardModel[];
  phase: "trump_selection_provisional" | "trump_selection_final";
  highestBid1?: Bid;
  highestBid2?: Bid;
  newBiddingInRound2: boolean;
  foldedCard?: CardModel;
  trumpState: {
    provisionalTrumpSuit?: string;
    provisionalTrumpCardId?: string;
    finalTrumpSuit?: string;
    finalTrumpCardId?: string;
    trumpRevealed: boolean;
  };
  onSelectProvisionalTrump: (cardId: string) => void;
  onFinalizeTrump: (keepProvisional: boolean, newTrumpCardId?: string) => void;
}

const TrumpSelectionInterface: React.FC<TrumpSelectionInterfaceProps> = ({
  currentPlayerName,
  currentPlayerHand,
  phase,
  highestBid1,
  highestBid2,
  newBiddingInRound2,
  foldedCard,
  trumpState,
  onSelectProvisionalTrump,
  onFinalizeTrump,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [keepProvisional, setKeepProvisional] = useState<boolean | null>(null);

  // Effect to handle automatic trump selection decisions
  useEffect(() => {
    if (phase === "trump_selection_final") {
      const bidderChanged = highestBid1?.playerId !== highestBid2?.playerId;

      // If bidder changed, they must select a new trump
      if (bidderChanged) {
        setKeepProvisional(false);
      }
      // If no new bidding in round 2, must keep provisional trump
      else if (!newBiddingInRound2) {
        setKeepProvisional(true);
      }
    }
  }, [phase, highestBid1?.playerId, highestBid2?.playerId, newBiddingInRound2]);

  const handleCardClick = (card: CardModel) => {
    setSelectedCardId(selectedCardId === card.id ? null : card.id);
  };

  const handleProvisionalTrumpSelect = () => {
    if (selectedCardId) {
      onSelectProvisionalTrump(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleFinalizeTrump = (keep: boolean) => {
    if (keep) {
      // Keep the provisional trump
      onFinalizeTrump(true);
    } else if (selectedCardId) {
      // Change to a new trump
      onFinalizeTrump(false, selectedCardId);
    }
    setSelectedCardId(null);
    setKeepProvisional(null);
  };

  // Get card suits from player's hand (for grouping)
  const cardSuits = Array.from(
    new Set(currentPlayerHand.map((card) => card.suit))
  );

  // Organize cards by suit for better display
  const cardsBySuit = cardSuits.reduce((acc, suit) => {
    acc[suit] = currentPlayerHand.filter((card) => card.suit === suit);
    return acc;
  }, {} as Record<string, CardModel[]>);

  // Common card display component to avoid repetition
  const CardDisplay = () => (
    <div className="hand-cards overflow-y-auto max-h-56 mb-4">
      {cardSuits.map((suit) => (
        <div key={suit} className="mb-2">
          <h4
            className={`text-xs font-medium mb-1 ${
              suit === "Hearts" || suit === "Diamonds"
                ? "text-red-500"
                : "text-blue-400"
            }`}
          >
            {suit}{" "}
            {suit === "Hearts"
              ? "♥"
              : suit === "Diamonds"
              ? "♦"
              : suit === "Clubs"
              ? "♣"
              : "♠"}
          </h4>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {cardsBySuit[suit].map((card) => (
              <div
                key={card.id}
                className={`cursor-pointer transition-all duration-200 flex-shrink-0`}
                onClick={() => handleCardClick(card)}
              >
                <Card
                  card={card}
                  size="sm"
                  isSelectable={true}
                  isSelected={selectedCardId === card.id}
                  onClick={handleCardClick}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Common selected card preview component
  const SelectedCardPreview = () => (
    <div className="selected-card-preview flex justify-center items-center mb-3">
      {selectedCardId ? (
        <div className="text-center flex items-center gap-3">
          <Card
            card={currentPlayerHand.find((c) => c.id === selectedCardId)}
            size="md"
          />
          <div>
            <p className="text-sm text-slate-300">
              Selected card:
              <span className="font-bold ml-1 text-indigo-300">
                {currentPlayerHand.find((c) => c.id === selectedCardId)?.suit}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center h-16 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Select a card to fold...</p>
        </div>
      )}
    </div>
  );

  // Provisional trump selection
  if (phase === "trump_selection_provisional") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
        <div className="trump-selection bg-slate-900 text-slate-100 rounded-xl shadow-xl p-4 w-full max-w-md mx-auto border border-indigo-600 overflow-hidden">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Select Provisional Trump
            </h3>
            <p className="text-slate-300 text-sm mt-1">
              {currentPlayerName}, fold a card to establish the provisional
              trump suit
            </p>
          </div>

          {/* Selected card preview with enhanced styling */}
          <div className="selected-card-preview flex justify-center items-center mb-4">
            {selectedCardId ? (
              <div className="text-center flex flex-col items-center gap-2 p-3 bg-slate-800 rounded-lg border border-indigo-500">
                <p className="text-slate-300 text-sm font-medium">
                  Selected Card:
                </p>
                <div className="flex items-center gap-3">
                  <Card
                    card={currentPlayerHand.find(
                      (c) => c.id === selectedCardId
                    )}
                    size="md"
                  />
                  <div>
                    <p className="text-sm text-slate-300">
                      Trump Suit:
                      <span className="font-bold ml-1 text-indigo-300 text-lg">
                        {
                          currentPlayerHand.find((c) => c.id === selectedCardId)
                            ?.suit
                        }
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center h-16 flex items-center justify-center p-3 bg-slate-800 rounded-lg border border-slate-700 w-full">
                <p className="text-slate-400 text-sm">
                  Select a card to fold...
                </p>
              </div>
            )}
          </div>

          <CardDisplay />

          <div className="flex justify-center mt-4">
            <button
              type="button"
              className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 ${
                !selectedCardId
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-indigo-500 hover:to-purple-500"
              }`}
              onClick={handleProvisionalTrumpSelect}
              disabled={!selectedCardId}
            >
              Fold Card and Set Trump
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Final trump selection
  if (phase === "trump_selection_final") {
    // Check if the current player is different from the provisional bidder
    const bidderChanged = highestBid1?.playerId !== highestBid2?.playerId;

    // If no new bidding happened in round 2, the player must keep the provisional trump
    // Also, if the bidder changed, they cannot keep the provisional trump
    const mustKeepProvisional = !newBiddingInRound2;

    // If bidder changed, the new bidder must select a new trump
    const mustSelectNewTrump = bidderChanged;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
        <div className="trump-selection bg-slate-900 text-slate-100 rounded-xl shadow-xl p-4 w-full max-w-md mx-auto border border-indigo-600 overflow-hidden">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Finalize Trump Selection
            </h3>
            <p className="text-slate-300 text-sm mt-1">
              {currentPlayerName},{" "}
              {mustKeepProvisional
                ? "you must keep the provisional trump (everyone passed in round 2)"
                : mustSelectNewTrump
                ? "as the new highest bidder, you must select a new trump"
                : "decide whether to keep or change the trump suit"}
            </p>
          </div>

          {/* Show provisional trump card and suit */}
          <div className="provisional-trump mb-3 p-3 bg-slate-800 rounded-lg text-center border border-slate-700">
            <p className="text-slate-300 text-sm mb-1">Provisional Trump:</p>
            <div className="flex justify-center items-center gap-3">
              {foldedCard ? (
                <>
                  <Card card={foldedCard} size="md" />
                  <div>
                    <span className="text-lg font-bold text-indigo-400">
                      {trumpState.provisionalTrumpSuit}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-amber-400">No card selected yet</span>
              )}
            </div>
          </div>

          {mustKeepProvisional ? (
            // If must keep provisional trump, show only confirmation button
            <div className="flex justify-center">
              <button
                type="button"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-5 rounded-lg text-sm font-medium shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
                onClick={() => handleFinalizeTrump(true)}
              >
                Confirm Provisional Trump
              </button>
            </div>
          ) : mustSelectNewTrump ? (
            // If bidder changed, force new trump selection (no choice to keep)
            <div className="text-center">
              <p className="text-amber-300 text-sm font-medium mb-2">
                You must select a new trump card from your hand
              </p>

              <SelectedCardPreview />
              <CardDisplay />

              <button
                type="button"
                className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 ${
                  !selectedCardId
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-indigo-500 hover:to-purple-500"
                }`}
                onClick={() => handleFinalizeTrump(false)}
                disabled={!selectedCardId}
              >
                Set New Trump
              </button>
            </div>
          ) : (
            // If bidder hasn't changed but there was new bidding, they have a choice
            <div>
              <div className="choice-buttons grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  className={`bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3 rounded-lg text-sm font-medium shadow-lg transition-colors duration-200 ${
                    keepProvisional === false ? "ring-2 ring-indigo-300" : ""
                  }`}
                  onClick={() => setKeepProvisional(false)}
                >
                  Change Trump
                </button>
                <button
                  type="button"
                  className={`bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium shadow-lg transition-colors duration-200 ${
                    keepProvisional === true ? "ring-2 ring-purple-300" : ""
                  }`}
                  onClick={() => setKeepProvisional(true)}
                >
                  Keep Provisional
                </button>
              </div>

              {keepProvisional === false ? (
                // Show card selection UI if player chose to change trump
                <div>
                  <SelectedCardPreview />
                  <CardDisplay />
                </div>
              ) : null}

              <div className="flex justify-center">
                <button
                  type="button"
                  className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 ${
                    (keepProvisional === false && !selectedCardId) ||
                    keepProvisional === null
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-indigo-500 hover:to-purple-500"
                  }`}
                  onClick={() => handleFinalizeTrump(keepProvisional === true)}
                  disabled={
                    (keepProvisional === false && !selectedCardId) ||
                    keepProvisional === null
                  }
                >
                  Confirm Trump Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default TrumpSelectionInterface;
