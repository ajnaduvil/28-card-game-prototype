import React, { useState, useEffect } from "react";
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
  newBiddingInRound2: boolean;
}

const TrumpSelectionInterface: React.FC<TrumpSelectionInterfaceProps> = ({
  playerHand,
  onSelectProvisionalTrump,
  onFinalizeTrump,
  trumpState,
  foldedCard,
  currentPhase,
  playerName,
  newBiddingInRound2,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [keepProvisional, setKeepProvisional] = useState<boolean | null>(null);

  // Effect to automatically set keepProvisional to false when bidder has changed
  useEffect(() => {
    if (currentPhase === "bidding2_complete") {
      const bidderChanged =
        trumpState.provisionalBidderId !== trumpState.finalDeclarerId;
      if (bidderChanged) {
        setKeepProvisional(false);
      }
    }
  }, [
    currentPhase,
    trumpState.provisionalBidderId,
    trumpState.finalDeclarerId,
  ]);

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
      <div className="trump-selection bg-gray-800 text-white rounded-lg shadow-md p-4 w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">Select Provisional Trump</h3>
          <p className="text-gray-300">
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
              <p className="mt-2 text-gray-300">
                Selected card suit:
                <span className="font-bold ml-1 text-blue-300">
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
            type="button"
            className={`bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded-lg ${
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
    // Check if the current player (final declarer) is different from the provisional bidder
    const bidderChanged =
      trumpState.provisionalBidderId !== trumpState.finalDeclarerId;

    // If no new bidding happened in round 2 and the player is the same as Bidder 1,
    // they must keep the provisional trump
    const mustKeepProvisional =
      !newBiddingInRound2 &&
      trumpState.provisionalBidderId === trumpState.finalDeclarerId;

    // If bidder changed, the new bidder must select a new trump
    const mustSelectNewTrump = bidderChanged;

    return (
      <div className="trump-selection bg-gray-800 text-white rounded-lg shadow-md p-4 w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">Finalize Trump Selection</h3>
          <p className="text-gray-300">
            {playerName},{" "}
            {mustKeepProvisional
              ? "you must keep the provisional trump (no new bidding in round 2)"
              : mustSelectNewTrump
              ? "as the new highest bidder, you must select a new trump"
              : "decide whether to keep or change the trump suit"}
          </p>
        </div>

        {/* Only show provisional trump info if the bidder hasn't changed */}
        {trumpState.provisionalTrumpSuit && !bidderChanged && (
          <div className="provisional-trump mb-6 p-3 bg-gray-700 rounded-lg text-center">
            <p className="text-gray-300 mb-2">Provisional Trump Suit:</p>
            <span
              className={`text-xl font-bold ${
                trumpState.provisionalTrumpSuit === "Hearts" ||
                trumpState.provisionalTrumpSuit === "Diamonds"
                  ? "text-red-400"
                  : "text-blue-300"
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

        {mustKeepProvisional ? (
          // If must keep provisional trump, show only confirmation button
          <div className="flex justify-center">
            <button
              type="button"
              className="bg-green-600 text-white py-2 px-6 rounded-lg"
              onClick={() => handleFinalizeTrump(true)}
            >
              Confirm Trump Selection
            </button>
          </div>
        ) : mustSelectNewTrump ? (
          // If bidder changed, force new trump selection (no choice to keep)
          <div className="text-center mb-4">
            <p className="text-amber-300 font-medium">
              You must select a new trump card from your hand
            </p>
            {/* Automatically show card selection UI for new bidder */}
            <div className="select-new-trump mt-4">
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

              {selectedCardId && (
                <div className="selected-card-preview my-4 flex justify-center">
                  <div className="text-center">
                    <p className="mt-2 text-gray-300">
                      New trump suit:
                      <span className="font-bold ml-1 text-blue-300">
                        {playerHand.find((c) => c.id === selectedCardId)?.suit}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  className={`bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded-lg ${
                    !selectedCardId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => handleFinalizeTrump(false, selectedCardId)}
                  disabled={!selectedCardId}
                >
                  Confirm New Trump
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Otherwise, show choices
          <>
            <div className="choices mb-4 flex justify-center gap-4">
              <button
                type="button"
                className={`py-2 px-4 rounded-lg ${
                  keepProvisional === true
                    ? "bg-green-700 text-white"
                    : "bg-green-900 text-green-300 border border-green-800 hover:bg-green-800"
                }`}
                onClick={() => setKeepProvisional(true)}
              >
                Keep Current Trump
              </button>

              <button
                type="button"
                className={`py-2 px-4 rounded-lg ${
                  keepProvisional === false
                    ? "bg-purple-700 text-white"
                    : "bg-purple-900 text-purple-300 border border-purple-800 hover:bg-purple-800"
                }`}
                onClick={() => setKeepProvisional(false)}
              >
                Change Trump Suit
              </button>
            </div>

            {keepProvisional === false && (
              <div className="select-new-trump">
                <p className="text-center mb-2 text-gray-300">
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
                      <p className="mt-2 text-gray-300">
                        New trump suit:
                        <span className="font-bold ml-1 text-blue-300">
                          {
                            playerHand.find((c) => c.id === selectedCardId)
                              ?.suit
                          }
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-4">
              <button
                type="button"
                className={`bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded-lg ${
                  keepProvisional === null ||
                  (keepProvisional === false && !selectedCardId)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() =>
                  keepProvisional !== null &&
                  handleFinalizeTrump(keepProvisional)
                }
                disabled={
                  keepProvisional === null ||
                  (keepProvisional === false && !selectedCardId)
                }
              >
                Confirm Trump Selection
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default TrumpSelectionInterface;
