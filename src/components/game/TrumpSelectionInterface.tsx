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

  // No longer need to organize cards by suit

  // Horizontal card display component with max 4 cards per row
  const CardDisplay = () => {
    // Group cards into rows of 4
    const rows = [];
    for (let i = 0; i < currentPlayerHand.length; i += 4) {
      rows.push(currentPlayerHand.slice(i, i + 4));
    }

    return (
      <div className="hand-cards mb-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-3 mb-3">
            {row.map((card) => (
              <div
                key={card.id}
                className={`cursor-pointer transition-all duration-200 transform ${
                  selectedCardId === card.id
                    ? "scale-110 -translate-y-2"
                    : "hover:-translate-y-1"
                }`}
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
        ))}
      </div>
    );
  };

  // Improved selected card preview component
  const SelectedCardPreview = () => (
    <div className="selected-card-preview mb-4">
      {selectedCardId ? (
        <div className="flex flex-col items-center">
          <div className="mb-2">
            <p className="text-center text-sm text-indigo-300 font-medium mb-1">
              Selected Trump Suit:
              <span className="font-bold ml-1 text-white">
                {currentPlayerHand.find((c) => c.id === selectedCardId)?.suit}
              </span>
            </p>
          </div>
          <div className="transform scale-125 shadow-lg rounded-lg overflow-hidden">
            <Card
              card={currentPlayerHand.find((c) => c.id === selectedCardId)}
              size="md"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-slate-300 text-sm">
            Select a card to set as trump
          </p>
        </div>
      )}
    </div>
  );

  // Provisional trump selection
  if (phase === "trump_selection_provisional") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
        <div className="trump-selection bg-slate-900 text-slate-100 rounded-xl shadow-xl p-6 w-full max-w-md mx-auto border border-indigo-600 overflow-hidden">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Select Trump
            </h3>
            <p className="text-slate-300 text-sm mt-1">
              {currentPlayerName}, select a card to establish the trump suit
            </p>
          </div>

          {/* Improved selected card preview */}
          <SelectedCardPreview />

          {/* Horizontal card display */}
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
            <CardDisplay />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                !selectedCardId
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl"
              }`}
              onClick={handleProvisionalTrumpSelect}
              disabled={!selectedCardId}
            >
              Confirm Trump Selection
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
        <div className="trump-selection bg-slate-900 text-slate-100 rounded-xl shadow-xl p-6 w-full max-w-md mx-auto border border-indigo-600 overflow-hidden">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Finalize Trump
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

          {/* Show provisional trump card and suit only if the bidder hasn't changed */}
          {!bidderChanged && foldedCard && (
            <div className="provisional-trump mb-4 p-4 bg-slate-800/80 rounded-lg text-center border border-indigo-700">
              <p className="text-indigo-300 text-sm font-medium mb-2">
                Current Trump:
              </p>
              <div className="flex flex-col items-center">
                <div className="mb-1">
                  <span className="text-lg font-bold text-white">
                    {trumpState.provisionalTrumpSuit}
                  </span>
                </div>
                <div className="transform scale-110">
                  <Card card={foldedCard} size="md" />
                </div>
              </div>
            </div>
          )}

          {mustKeepProvisional ? (
            // If must keep provisional trump, show only confirmation button
            <div className="flex justify-center mt-4">
              <button
                type="button"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl transition-all duration-200"
                onClick={() => handleFinalizeTrump(true)}
              >
                Confirm Trump
              </button>
            </div>
          ) : mustSelectNewTrump ? (
            // If bidder changed, force new trump selection (no choice to keep)
            <div className="text-center">
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <SelectedCardPreview />
                <CardDisplay />
              </div>

              <button
                type="button"
                className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                  !selectedCardId
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl"
                }`}
                onClick={() => handleFinalizeTrump(false)}
                disabled={!selectedCardId}
              >
                Confirm Trump Selection
              </button>
            </div>
          ) : (
            // If bidder hasn't changed but there was new bidding, they have a choice
            <div>
              <div className="choice-buttons flex gap-3 mb-4">
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                    keepProvisional === false
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                      : "bg-slate-700 text-slate-200 hover:bg-indigo-600 hover:text-white"
                  }`}
                  onClick={() => setKeepProvisional(false)}
                >
                  Change Trump
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                    keepProvisional === true
                      ? "bg-purple-600 text-white ring-2 ring-purple-300"
                      : "bg-slate-700 text-slate-200 hover:bg-purple-600 hover:text-white"
                  }`}
                  onClick={() => setKeepProvisional(true)}
                >
                  Keep Current
                </button>
              </div>

              {keepProvisional === false ? (
                // Show card selection UI if player chose to change trump
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <SelectedCardPreview />
                  <CardDisplay />
                </div>
              ) : null}

              <div className="flex justify-center">
                <button
                  type="button"
                  className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow-lg transition-all duration-200 ${
                    (keepProvisional === false && !selectedCardId) ||
                    keepProvisional === null
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl"
                  }`}
                  onClick={() => handleFinalizeTrump(keepProvisional === true)}
                  disabled={
                    (keepProvisional === false && !selectedCardId) ||
                    keepProvisional === null
                  }
                >
                  Confirm Selection
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
