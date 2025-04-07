import React, { useEffect, useState } from "react";
import { Trick } from "../../models/game";
import Card from "./Card";

interface StandaloneTrickConfirmationProps {
  trick: Trick;
  onConfirm: () => void;
  autoConfirmDelay?: number; // in milliseconds, default 3000 (3 seconds)
  winnerName?: string;
}

const StandaloneTrickConfirmation: React.FC<
  StandaloneTrickConfirmationProps
> = ({ trick, onConfirm, autoConfirmDelay = 3000, winnerName = "Unknown" }) => {
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
    <div className="fixed bottom-0 left-0 right-0 bg-green-800 border-t-4 border-yellow-400 p-4 shadow-lg z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500 text-green-900 font-bold px-3 py-1 rounded-full">
            Trick Complete!
          </div>

          <div className="text-white">
            <span className="text-yellow-300 font-bold">{winnerName}</span> wins
            with
            <span className="text-yellow-300 font-bold ml-1">
              {trick.points}
            </span>{" "}
            points
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {trick.cards.map((card) => (
              <div
                key={card.id}
                className="transform hover:translate-y-[-10px] transition-transform"
              >
                <Card card={card} size="sm" showPointValue={true} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Continue ({timeLeft}s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandaloneTrickConfirmation;
