import React from "react";
import { Card as CardModel } from "../../models/card";

interface CardProps {
  card?: CardModel;
  isSelectable?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: (card: CardModel) => void;
  size?: "sm" | "md" | "lg";
  showBack?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  isSelectable = false,
  isSelected = false,
  isPlayable = false,
  onClick,
  size = "md",
  showBack = false,
}) => {
  // Size classes for the card
  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-16 h-22",
    lg: "w-24 h-32",
  };

  // Get the SVG path based on card ID
  const getCardImage = () => {
    if (showBack || !card) {
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
    ${!isPlayable && isSelectable ? "opacity-70" : ""}
  `;

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      data-testid={`card-${card?.id || "back"}`}
    >
      <img
        src={getCardImage()}
        alt={card ? `${card.rank} of ${card.suit}` : "Card back"}
        className="w-full h-full object-contain"
      />
      {isPlayable && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-lg"></div>
      )}
    </div>
  );
};

export default Card;
