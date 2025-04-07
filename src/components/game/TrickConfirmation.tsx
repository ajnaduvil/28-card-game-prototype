import React, { useEffect, useState } from "react";
import { Trick } from "../../models/game";

interface TrickConfirmationProps {
  trick: Trick;
  onConfirm: () => void;
  autoConfirmDelay?: number; // in milliseconds, default 3000 (3 seconds)
  winnerName?: string;
}

const TrickConfirmation: React.FC<TrickConfirmationProps> = ({
  trick,
  onConfirm,
  autoConfirmDelay = 3000,
  winnerName = "Unknown",
}) => {
  const [timeLeft, setTimeLeft] = useState(autoConfirmDelay / 1000);

  // Auto-confirm after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onConfirm();
    }, autoConfirmDelay);

    // Countdown timer for UI
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onConfirm, autoConfirmDelay]);

  // Component is now working correctly

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ pointerEvents: "auto" }}
    >
      {/* Semi-transparent background - made more visible */}
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full"></div>

      {/* Confirmation UI - made larger and more prominent */}
      <div className="relative bg-green-800 bg-opacity-95 rounded-lg px-6 py-4 text-center shadow-xl border-2 border-yellow-400 max-w-[220px] w-full z-50">
        {/* Winner badge */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-green-900 text-xs font-bold py-1 px-3 rounded-full shadow-md">
          Trick Complete
        </div>

        <div className="mt-3 mb-2 text-base">
          <span className="text-yellow-300 font-bold">{winnerName}</span>
          <span className="text-white"> wins</span>
        </div>

        <div className="text-center mb-3">
          <span className="text-white text-sm">Points: </span>
          <span className="text-yellow-300 font-bold text-xl">
            {trick.points}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            onConfirm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm w-full"
        >
          Continue ({timeLeft}s)
        </button>
      </div>
    </div>
  );
};

export default TrickConfirmation;
