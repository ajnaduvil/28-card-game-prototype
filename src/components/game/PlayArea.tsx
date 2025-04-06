import React from "react";
import Card from "./Card";
import { Trick, TrumpState } from "../../models/game";

interface PlayAreaProps {
  currentTrick: Trick | null;
  trumpState: TrumpState;
}

const PlayArea: React.FC<PlayAreaProps> = ({ currentTrick }) => {
  if (!currentTrick || currentTrick.cards.length === 0) {
    return (
      <div className="play-area w-80 h-80 rounded-full bg-green-900 border-4 border-green-700 shadow-inner flex items-center justify-center">
        <span className="text-white opacity-50">Play Area</span>
      </div>
    );
  }

  // Calculate total points in the current trick
  const trickPoints = currentTrick.cards.reduce(
    (sum, card) => sum + card.pointValue,
    0
  );

  // Position cards in a circle pattern based on position in trick
  const getCardPosition = (index: number, totalCards: number) => {
    // Only calculating for 3 or 4 cards, but could be extended for more
    const angleStep = 360 / Math.max(totalCards, 3);
    const angle = index * angleStep;
    const radius = 90; // Increased distance from center for larger play area

    const radian = (angle - 90) * (Math.PI / 180);
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;

    return { x, y };
  };

  return (
    <div className="play-area w-80 h-80 rounded-full bg-green-900 border-4 border-green-700 shadow-inner relative">
      {/* Center reference point */}
      <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2" />

      {/* Total trick points indicator */}
      {trickPoints > 0 && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 bg-opacity-90 px-2 py-1 rounded-full text-white text-sm font-bold">
          {trickPoints} pts
        </div>
      )}

      {/* Played cards */}
      {currentTrick.cards.map((card, index) => {
        const position = getCardPosition(index, currentTrick.cards.length);

        return (
          <div
            key={`${card.id}-${index}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              zIndex: index + 1,
            }}
          >
            <Card card={card} size="md" showPointValue={true} />
          </div>
        );
      })}

      {/* Lead suit indicator */}
      {currentTrick.leadSuit && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-700 text-white px-3 py-1 rounded-full text-sm shadow-md font-medium">
          Lead: {currentTrick.leadSuit}
        </div>
      )}
    </div>
  );
};

export default PlayArea;
