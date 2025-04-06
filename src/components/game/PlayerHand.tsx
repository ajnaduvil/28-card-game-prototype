import React, { useEffect, useState } from "react";
import { Card as CardModel } from "../../models/card";
import Card from "./Card";
import { Trick, TrumpState } from "../../models/game";
import { isValidPlay, canFollowSuit } from "../../services/local/cardUtils";

interface PlayerHandProps {
  hand: CardModel[];
  isCurrentPlayer: boolean;
  onCardPlay?: (card: CardModel) => void;
  onRequestTrumpReveal?: () => void;
  currentTrick?: Trick | null;
  trumpState?: TrumpState;
  playerId: string;
  finalDeclarerId?: string;
  hideCards?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isCurrentPlayer,
  onCardPlay,
  onRequestTrumpReveal,
  currentTrick,
  trumpState,
  playerId,
  finalDeclarerId,
  hideCards = false,
}) => {
  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [canAskTrump, setCanAskTrump] = useState<boolean>(false);
  const [leadSuitCards, setLeadSuitCards] = useState<Record<string, boolean>>(
    {}
  );

  // Update playable cards whenever relevant props change
  useEffect(() => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) {
      setPlayableCards({});
      setCanAskTrump(false);
      setLeadSuitCards({});
      return;
    }

    const playableMap: Record<string, boolean> = {};
    const leadSuitMap: Record<string, boolean> = {};

    hand.forEach((card) => {
      playableMap[card.id] = isValidPlay(
        card,
        playerId,
        hand,
        currentTrick,
        trumpState,
        finalDeclarerId
      );

      // Mark cards of the lead suit
      if (
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit === card.suit
      ) {
        leadSuitMap[card.id] = true;
      }
    });

    // Check if the player cannot follow suit and is not the declarer
    // This is when they should be able to ask for trump
    const canFollow =
      currentTrick.cards.length > 0 &&
      canFollowSuit(hand, currentTrick.leadSuit);

    setCanAskTrump(
      isCurrentPlayer &&
        !canFollow &&
        currentTrick.cards.length > 0 &&
        playerId !== finalDeclarerId &&
        !trumpState.trumpRevealed
    );

    setPlayableCards(playableMap);
    setLeadSuitCards(leadSuitMap);
  }, [
    hand,
    isCurrentPlayer,
    currentTrick,
    trumpState,
    playerId,
    finalDeclarerId,
  ]);

  const handleCardClick = (card: CardModel) => {
    if (!isCurrentPlayer) return;

    // If it's the current player's turn and the card is playable
    if (currentTrick && trumpState && playableCards[card.id]) {
      if (onCardPlay) {
        onCardPlay(card);
        setSelectedCard(null);
      }
    } else {
      // Just select/deselect the card when it's not playable or not player's turn
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  const handleAskTrump = () => {
    if (onRequestTrumpReveal) {
      onRequestTrumpReveal();
    }
  };

  if (hand.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">No cards</div>
    );
  }

  return (
    <div className="relative player-hand flex flex-col items-center">
      {canAskTrump && (
        <button
          onClick={handleAskTrump}
          className="mb-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
        >
          Ask Trump?
        </button>
      )}

      {/* Lead suit indicator */}
      {currentTrick &&
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit && (
          <div className="mb-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm shadow-md">
            Lead Suit: {currentTrick.leadSuit}
          </div>
        )}

      <div className="flex relative" style={{ height: "135px" }}>
        {hand.map((card, index) => {
          const isPlayable = isCurrentPlayer && playableCards[card.id];
          const isSelected = selectedCard?.id === card.id;
          const isLeadSuit = leadSuitCards[card.id];
          const offset = Math.min(20, 200 / hand.length); // Dynamically calculate offset based on hand size

          return (
            <div
              key={card.id}
              className={`absolute transition-all duration-300 ${
                isLeadSuit ? "transform hover:-translate-y-2" : ""
              }`}
              style={{
                left: `${index * offset}px`,
                zIndex: isSelected ? 10 : index,
              }}
            >
              <div className="relative">
                <Card
                  card={hideCards ? undefined : card}
                  isPlayable={isPlayable}
                  isSelectable={isCurrentPlayer}
                  isSelected={isSelected}
                  isLeadSuit={isLeadSuit}
                  onClick={handleCardClick}
                  size="md"
                  showPointValue={isCurrentPlayer && !hideCards}
                  faceDown={hideCards}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;
