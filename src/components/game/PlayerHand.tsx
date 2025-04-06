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
}) => {
  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [canAskTrump, setCanAskTrump] = useState<boolean>(false);

  // Update playable cards whenever relevant props change
  useEffect(() => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) {
      setPlayableCards({});
      setCanAskTrump(false);
      return;
    }

    const playableMap: Record<string, boolean> = {};

    hand.forEach((card) => {
      playableMap[card.id] = isValidPlay(
        card,
        playerId,
        hand,
        currentTrick,
        trumpState,
        finalDeclarerId
      );
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

      <div className="flex relative" style={{ height: "135px" }}>
        {hand.map((card, index) => {
          const isPlayable = isCurrentPlayer && playableCards[card.id];
          const isSelected = selectedCard?.id === card.id;
          const offset = Math.min(20, 200 / hand.length); // Dynamically calculate offset based on hand size

          return (
            <div
              key={card.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${index * offset}px`,
                zIndex: isSelected ? 10 : index,
              }}
            >
              <Card
                card={card}
                isPlayable={isPlayable}
                isSelectable={isCurrentPlayer}
                isSelected={isSelected}
                onClick={handleCardClick}
                size="md"
                showPointValue={isCurrentPlayer}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;
