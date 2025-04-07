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
    <div className="bg-slate-900 text-slate-100 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-auto border border-indigo-600 overflow-hidden">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Trick Complete
        </h3>
        <p className="text-slate-300 text-sm mt-1">
          <span className="font-medium text-indigo-300">{winnerName}</span> wins
          with
          <span className="font-medium text-indigo-300 ml-1">
            {trick.points}
          </span>{" "}
          points
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
        <p className="text-xs text-slate-400 mb-2 text-center">
          Cards played in this trick:
        </p>
        <div className="flex justify-center gap-2">
          {trick.cards.map((card) => (
            <div
              key={card.id}
              className="transform hover:-translate-y-2 transition-all duration-200"
            >
              <Card card={card} size="sm" showPointValue={false} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onConfirm}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2 px-5 rounded-lg text-sm font-medium shadow-lg transition-all duration-200"
        >
          Continue ({timeLeft}s)
        </button>
      </div>
    </div>
  );
};

export default StandaloneTrickConfirmation;
