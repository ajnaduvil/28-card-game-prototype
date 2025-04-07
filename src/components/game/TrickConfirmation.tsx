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

  // Log that we're rendering the confirmation UI
  console.log("Rendering TrickConfirmation component", {
    trick,
    winnerName,
    timeLeft,
  });

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
      {/* Added a full-screen semi-transparent overlay to make it more visible */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative bg-red-800 rounded-lg p-6 text-center shadow-xl border-4 border-yellow-500 max-w-xs w-full">
        <h2 className="text-2xl font-bold text-white mb-4">TRICK COMPLETE!</h2>

        <div className="mb-4 text-xl">
          <span className="text-yellow-400 font-bold">{winnerName}</span>
          <span className="text-white"> wins the trick</span>
        </div>

        <div className="text-center mb-4">
          <span className="text-white">Points: </span>
          <span className="text-yellow-400 font-bold text-2xl">
            {trick.points}
          </span>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
        >
          Continue ({timeLeft}s)
        </button>
      </div>
    </div>
  );
};

export default TrickConfirmation;
