import React from "react";
import { Card as CardModel } from "../../models/card";

interface CardProps {
  card?: CardModel;
  isSelectable?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  isLeadSuit?: boolean;
  onClick?: (card: CardModel) => void;
  size?: "sm" | "md" | "lg";
  showBack?: boolean;
  showPointValue?: boolean;
  faceDown?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  isSelectable = false,
  isSelected = false,
  isPlayable = false,
  isLeadSuit = false,
  onClick,
  size = "md",
  showBack = false,
  showPointValue = false,
  faceDown = false,
}) => {
  // Size classes for the card
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-22",
    lg: "w-24 h-32",
  };

  // Get the SVG path based on card ID
  const getCardImage = () => {
    if (showBack || faceDown || !card) {
      return "/src/assets/cards/1B.svg"; // Back of card
    }

    // Map card ID to filename
    const suit = card.suit[0];
    const rank = card.rank === "10" ? "T" : card.rank;
    return `/src/assets/cards/${rank}${suit}.svg`;
  };

  const handleClick = () => {
    if (isSelectable && card && onClick) {
      onClick(card);
    }
  };

  const cardClasses = `
    relative 
    ${sizeClasses[size]} 
    rounded-lg 
    shadow-md 
    transition-transform 
    ${isSelected ? "transform -translate-y-3 ring-2 ring-blue-500" : ""} 
    ${isPlayable ? "cursor-pointer hover:shadow-lg" : ""}
    ${(!isPlayable && isSelectable) || faceDown ? "opacity-70" : ""}
    ${isLeadSuit && !faceDown ? "ring-2 ring-blue-600" : ""}
  `;

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      data-testid={`card-${card?.id || "back"}`}
    >
      <img
        src={getCardImage()}
        alt={card && !faceDown ? `${card.rank} of ${card.suit}` : "Card back"}
        className="w-full h-full object-contain"
      />

      {/* Point value indicator */}
      {card && showPointValue && card.pointValue > 0 && !faceDown && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md -mt-1 -mr-1">
          {card.pointValue}
        </div>
      )}

      {/* Card order indicator (small at bottom left) */}
      {card && showPointValue && !faceDown && (
        <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white rounded-sm px-1 text-[8px] mb-0.5 ml-0.5">
          #{card.order}
        </div>
      )}

      {isPlayable && !faceDown && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-lg"></div>
      )}

      {/* Lead suit indicator */}
      {isLeadSuit && !faceDown && !isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
          L
        </div>
      )}
    </div>
  );
};

export default Card;
