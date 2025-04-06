import React, { useEffect, useState } from "react";
import { Card as CardModel } from "../../models/card";
import Card from "./Card";
import { Trick, TrumpState } from "../../models/game";
import { isValidPlay } from "../../services/local/cardUtils";

interface PlayerHandProps {
  hand: CardModel[];
  isCurrentPlayer: boolean;
  onCardPlay?: (card: CardModel) => void;
  currentTrick?: Trick | null;
  trumpState?: TrumpState;
  playerId: string;
  finalDeclarerId?: string;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isCurrentPlayer,
  onCardPlay,
  currentTrick,
  trumpState,
  playerId,
  finalDeclarerId,
}) => {
  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);

  // Update playable cards whenever relevant props change
  useEffect(() => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) {
      setPlayableCards({});
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

  if (hand.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">No cards</div>
    );
  }

  return (
    <div className="relative player-hand flex justify-center">
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
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;
