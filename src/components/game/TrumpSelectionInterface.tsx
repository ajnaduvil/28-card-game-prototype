import React, { useState } from "react";
import { Card as CardModel } from "../../models/card";
import { TrumpState, GamePhase } from "../../models/game";
import Card from "./Card";

interface TrumpSelectionInterfaceProps {
  playerHand: CardModel[];
  onSelectProvisionalTrump?: (cardId: string) => void;
  onFinalizeTrump?: (keepProvisional: boolean, newTrumpCardId?: string) => void;
  trumpState: TrumpState;
  foldedCard?: CardModel;
  currentPhase: GamePhase;
  playerName: string;
}

const TrumpSelectionInterface: React.FC<TrumpSelectionInterfaceProps> = ({
  playerHand,
  onSelectProvisionalTrump,
  onFinalizeTrump,
  trumpState,
  foldedCard,
  currentPhase,
  playerName,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [keepProvisional, setKeepProvisional] = useState<boolean | null>(null);

  const handleCardClick = (card: CardModel) => {
    setSelectedCardId(selectedCardId === card.id ? null : card.id);
  };

  const handleProvisionalTrumpSelect = () => {
    if (selectedCardId && onSelectProvisionalTrump) {
      onSelectProvisionalTrump(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleFinalizeTrump = (keep: boolean) => {
    if (onFinalizeTrump) {
      if (keep) {
        // Keep the provisional trump
        onFinalizeTrump(true);
      } else if (selectedCardId) {
        // Change to a new trump
        onFinalizeTrump(false, selectedCardId);
      }
      setSelectedCardId(null);
      setKeepProvisional(null);
    }
  };

  // Provisional trump selection (Round 1)
  if (currentPhase === "bidding1_complete") {
    return (
      <div className="trump-selection bg-white rounded-lg shadow-md p-4 w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">Select Provisional Trump</h3>
          <p className="text-gray-600">
            {playerName}, fold a card to establish the provisional trump suit
          </p>
        </div>

        <div className="selected-card-preview my-4 flex justify-center">
          {selectedCardId && (
            <div className="text-center">
              <Card
                card={playerHand.find((c) => c.id === selectedCardId)}
                size="lg"
              />
              <p className="mt-2">
                Selected card suit:
                <span className="font-bold ml-1">
                  {playerHand.find((c) => c.id === selectedCardId)?.suit}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="hand-cards grid grid-cols-4 gap-2 justify-items-center mb-4">
          {playerHand.map((card) => (
            <div
              key={card.id}
              className={`cursor-pointer transform transition-transform ${
                selectedCardId === card.id
                  ? "scale-110 -translate-y-2"
                  : "hover:scale-105"
              }`}
              onClick={() => handleCardClick(card)}
            >
              <Card card={card} size="md" />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg ${
              !selectedCardId ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleProvisionalTrumpSelect}
            disabled={!selectedCardId}
          >
            Fold Card and Set Trump
          </button>
        </div>
      </div>
    );
  }

  // Final trump selection (Round 2)
  if (currentPhase === "bidding2_complete") {
    return (
      <div className="trump-selection bg-white rounded-lg shadow-md p-4 w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">Finalize Trump Selection</h3>
          <p className="text-gray-600">
            {playerName}, decide whether to keep or change the trump suit
          </p>
        </div>

        {trumpState.provisionalTrumpSuit && (
          <div className="provisional-trump mb-6 p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-gray-700 mb-2">Provisional Trump Suit:</p>
            <span
              className={`text-xl font-bold ${
                trumpState.provisionalTrumpSuit === "Hearts" ||
                trumpState.provisionalTrumpSuit === "Diamonds"
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {trumpState.provisionalTrumpSuit}
            </span>

            {foldedCard && (
              <div className="folded-card mt-2 flex justify-center">
                <Card card={foldedCard} size="md" />
              </div>
            )}
          </div>
        )}

        <div className="choices mb-4 flex justify-center gap-4">
          <button
            className={`py-2 px-4 rounded-lg ${
              keepProvisional === true
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
            }`}
            onClick={() => setKeepProvisional(true)}
          >
            Keep Current Trump
          </button>

          <button
            className={`py-2 px-4 rounded-lg ${
              keepProvisional === false
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200"
            }`}
            onClick={() => setKeepProvisional(false)}
          >
            Change Trump Suit
          </button>
        </div>

        {keepProvisional === false && (
          <div className="select-new-trump">
            <p className="text-center mb-2">
              Select a card with the new trump suit:
            </p>

            <div className="hand-cards grid grid-cols-4 gap-2 justify-items-center mb-4">
              {playerHand.map((card) => (
                <div
                  key={card.id}
                  className={`cursor-pointer transform transition-transform ${
                    selectedCardId === card.id
                      ? "scale-110 -translate-y-2"
                      : "hover:scale-105"
                  }`}
                  onClick={() => handleCardClick(card)}
                >
                  <Card card={card} size="md" />
                </div>
              ))}
            </div>

            <div className="selected-card-preview my-4 flex justify-center">
              {selectedCardId && (
                <div className="text-center">
                  <p className="mt-2">
                    New trump suit:
                    <span className="font-bold ml-1">
                      {playerHand.find((c) => c.id === selectedCardId)?.suit}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button
            className={`bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg ${
              keepProvisional === null ||
              (keepProvisional === false && !selectedCardId)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={() =>
              keepProvisional !== null && handleFinalizeTrump(keepProvisional)
            }
            disabled={
              keepProvisional === null ||
              (keepProvisional === false && !selectedCardId)
            }
          >
            Confirm Trump Selection
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TrumpSelectionInterface;
