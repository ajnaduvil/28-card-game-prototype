import React, { useEffect, useState } from "react";
import { Trick } from "../../models/game";

interface TrickConfirmationOverlayProps {
  trick: Trick;
  onConfirm: () => void;
  autoConfirmDelay?: number; // in milliseconds, default 3000 (3 seconds)
  winnerName?: string;
}

const TrickConfirmationOverlay: React.FC<TrickConfirmationOverlayProps> = ({
  trick,
  onConfirm,
  autoConfirmDelay = 3000,
  winnerName = "Unknown",
}) => {
  const [timeLeft, setTimeLeft] = useState(autoConfirmDelay / 1000);
  
  // Auto-confirm after delay
  useEffect(() => {
    console.log("TrickConfirmationOverlay mounted, setting up auto-confirm timer");
    
    const timer = setTimeout(() => {
      console.log("Auto-confirm timer expired, calling onConfirm");
      onConfirm();
    }, autoConfirmDelay);
    
    // Countdown timer for UI
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      console.log("TrickConfirmationOverlay unmounted, clearing timers");
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onConfirm, autoConfirmDelay]);
  
  console.log("Rendering TrickConfirmationOverlay", { trick, winnerName, timeLeft });
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-70"></div>
      
      <div className="relative bg-red-800 rounded-lg p-8 text-center shadow-xl border-4 border-yellow-500 max-w-md w-full">
        <h2 className="text-3xl font-bold text-white mb-6">TRICK COMPLETE!</h2>
        
        <div className="mb-6 text-2xl">
          <span className="text-yellow-400 font-bold">{winnerName}</span>
          <span className="text-white"> wins the trick</span>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-900 rounded-lg p-4 flex flex-wrap justify-center gap-2">
            {trick.cards.map((card) => (
              <div key={card.id} className="text-white">
                {card.rank} of {card.suit} ({card.pointValue} pts)
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mb-6">
          <span className="text-white">Total Points: </span>
          <span className="text-yellow-400 font-bold text-3xl">
            {trick.points}
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => {
            console.log("Continue button clicked");
            onConfirm();
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg transition-colors text-xl"
        >
          Continue ({timeLeft}s)
        </button>
      </div>
    </div>
  );
};

export default TrickConfirmationOverlay;
