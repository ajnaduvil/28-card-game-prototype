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
    sm: "w-14 h-20",
    md: "w-20 h-28",
    lg: "w-28 h-40",
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

  // Determine suit color for styling
  const getSuitColor = () => {
    if (!card || faceDown) return "";

    return card.suit === "Hearts" || card.suit === "Diamonds"
      ? "text-red-500 border-red-500"
      : "text-slate-100 border-slate-300";
  };

  const cardClasses = `
    relative
    ${sizeClasses[size]}
    rounded-lg
    shadow-lg
    transition-all duration-300
    ${isSelected ? "transform -translate-y-6 ring-2 ring-indigo-500" : ""}
    ${isPlayable ? "cursor-pointer hover:-translate-y-3 hover:shadow-xl" : ""}
    ${
      !isPlayable && isSelectable
        ? "opacity-70 hover:opacity-90 hover:-translate-y-1 cursor-pointer"
        : ""
    }
    ${faceDown ? "opacity-70" : ""}
    ${isLeadSuit && !faceDown ? "ring-2 ring-blue-500" : ""}
    ${isPlayable && isLeadSuit && !faceDown ? "transform -translate-y-3" : ""}
  `;

  // Add a subtle 3D effect to cards
  const cardStyle = {
    boxShadow: isSelected
      ? "0 10px 15px -3px rgba(79, 70, 229, 0.3)"
      : isPlayable
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
      : "0 1px 3px rgba(0, 0, 0, 0.12)",
    transform: `perspective(1000px) ${
      isSelected ? "rotateX(5deg) translateY(-1.5rem)" : "rotateX(5deg)"
    }`,
  };

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      style={cardStyle}
      data-testid={`card-${card?.id || "back"}`}
    >
      <img
        src={getCardImage()}
        alt={card && !faceDown ? `${card.rank} of ${card.suit}` : "Card back"}
        className="w-full h-full object-contain rounded-lg"
      />

      {/* Point value indicator */}
      {card && showPointValue && card.pointValue > 0 && !faceDown && (
        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
          {card.pointValue}
        </div>
      )}

      {/* Card rank & suit indicator (for easier reading) */}
      {card && !faceDown && size !== "sm" && (
        <div
          className={`absolute bottom-1 right-1 font-bold text-xs ${getSuitColor()}`}
        >
          {card.rank}
          <span className="ml-0.5">
            {card.suit === "Hearts"
              ? "♥"
              : card.suit === "Diamonds"
              ? "♦"
              : card.suit === "Clubs"
              ? "♣"
              : "♠"}
          </span>
        </div>
      )}

      {/* Lead suit indicator - now just a subtle highlight instead of an 'L' badge */}
    </div>
  );
};

export default Card;
