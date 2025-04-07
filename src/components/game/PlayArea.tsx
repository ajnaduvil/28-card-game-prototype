import React from "react";
import Card from "./Card";
import { Trick } from "../../models/game";
import TrickConfirmation from "./TrickConfirmation";

interface PlayAreaProps {
  currentTrick: Trick | null;
  playerPositions?: Record<string, string>; // Maps playerId to position (bottom, top, left, right, etc.)
  completedTrick?: Trick | null; // Completed trick awaiting confirmation
  onConfirmTrick?: () => void; // Callback to confirm the trick
  players?: Array<{ id: string; name: string }>; // Players for getting winner name
}

const PlayArea: React.FC<PlayAreaProps> = ({
  currentTrick,
  playerPositions = {},
  completedTrick = null,
  onConfirmTrick,
  players = [],
}) => {
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

  // Get position coordinates based on player position
  const getPositionCoordinates = (position: string) => {
    // Default to circle position if position not found
    const radius = 60; // Slightly reduced from 90 to keep cards closer to center
    let x = 0;
    let y = 0;

    switch (position) {
      case "bottom":
        x = 0;
        y = radius;
        break;
      case "top":
        x = 0;
        y = -radius;
        break;
      case "left":
        x = -radius;
        y = 0;
        break;
      case "right":
        x = radius;
        y = 0;
        break;
      case "top-left":
        x = -radius * 0.7;
        y = -radius * 0.7;
        break;
      case "top-right":
        x = radius * 0.7;
        y = -radius * 0.7;
        break;
      default: {
        // Fallback to original circle positioning
        const index = Object.keys(playerPositions).indexOf(position);
        const totalPlayers = Math.max(Object.keys(playerPositions).length, 3);
        const angleStep = 360 / totalPlayers;
        const angle = index * angleStep;
        const radian = (angle - 90) * (Math.PI / 180);
        x = Math.cos(radian) * radius;
        y = Math.sin(radian) * radius;
        break;
      }
    }

    return { x, y };
  };

  // If we have a completed trick awaiting confirmation, show the completed trick with confirmation UI
  if (completedTrick && onConfirmTrick) {
    // Find the winner name
    const winnerName = completedTrick.winnerId
      ? players.find((p) => p.id === completedTrick.winnerId)?.name || "Unknown"
      : "Unknown";

    // Render the completed trick with confirmation UI

    return (
      <div className="play-area w-80 h-80 rounded-full bg-green-900 border-4 border-green-700 shadow-inner relative overflow-visible">
        {/* Display the completed trick cards in a fan pattern */}
        {completedTrick.cards.map((card, index) => {
          // Position cards in a fan pattern in the center
          const totalCards = completedTrick.cards.length;
          const fanAngle = 30; // Total angle of the fan in degrees
          const startAngle = -fanAngle / 2; // Start from negative half of the fan angle
          const angleStep = fanAngle / (totalCards - 1 || 1); // Avoid division by zero
          const currentAngle = startAngle + index * angleStep;

          // Convert angle to radians and calculate position
          const radians = (currentAngle * Math.PI) / 180;
          const radius = 20; // Distance from center
          const x = Math.sin(radians) * radius; // Using sin for x to create horizontal fan
          const y = -Math.cos(radians) * radius * 0.5; // Using cos for y with smaller scale for vertical

          // Add a slight overlap effect
          const zIndex = index + 10; // Ensure cards are above the play area but below confirmation UI

          return (
            <div
              key={`${card.id}-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                zIndex,
                transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
              }}
            >
              <Card card={card} size="sm" showPointValue={true} />
            </div>
          );
        })}

        {/* Overlay the trick confirmation UI */}
        <div className="absolute inset-0 z-40 pointer-events-auto">
          <TrickConfirmation
            trick={completedTrick}
            onConfirm={onConfirmTrick}
            winnerName={winnerName}
            autoConfirmDelay={5000} // Increased to 5 seconds for better visibility during testing
          />
        </div>
      </div>
    );
  }

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
        // Find the player who played this card
        const playerId = currentTrick.playedBy[index];
        // Get the position (bottom, top, etc.) of that player
        const playerPosition = playerPositions[playerId] || "default";
        // Get x,y coordinates based on position
        const position = getPositionCoordinates(playerPosition);

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
