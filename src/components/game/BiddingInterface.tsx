import React, { useState, useRef, useEffect } from "react";
import { Bid } from "../../models/bid";
import { GamePhase } from "../../models/game";

interface BiddingInterfaceProps {
  currentPlayerName: string;
  highestBid: Bid | null;
  onBid: (amount: number | null, isHonors: boolean) => void;
  gameMode: "3p" | "4p";
  currentPhase: GamePhase;
  round: 1 | 2;
}

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  currentPlayerName,
  highestBid,
  onBid,
  gameMode,
  currentPhase,
  round,
}) => {
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [isHonors, setIsHonors] = useState(false);
  const honorsThreshold = gameMode === "3p" ? 18 : 20;

  // Draggable panel states
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Generate available bid amounts based on game rules
  const generateBidAmounts = (): number[] => {
    const minBid = round === 1 ? 14 : gameMode === "3p" ? 22 : 24;

    const maxBid = 28;
    const currentHighestBid =
      highestBid && !highestBid.isPass ? highestBid.amount : minBid - 1;

    const bids: number[] = [];
    for (let i = Math.max(minBid, currentHighestBid + 1); i <= maxBid; i++) {
      bids.push(i);
    }

    return bids;
  };

  const availableBids = generateBidAmounts();

  const handleBidClick = (amount: number) => {
    const newIsHonors = amount >= honorsThreshold;
    setSelectedBid(amount);
    setIsHonors(newIsHonors);
  };

  const handleSubmitBid = () => {
    if (selectedBid !== null) {
      onBid(selectedBid, isHonors);
      setSelectedBid(null);
      setIsHonors(false);
    }
  };

  const handlePass = () => {
    // Ensure we're explicitly passing null for the bid amount
    onBid(null, false);
    // Reset selected bid
    setSelectedBid(null);
    setIsHonors(false);
  };

  // Determine if the bidding phase is active
  const isBiddingPhase =
    currentPhase === "bidding1_start" ||
    currentPhase === "bidding1_in_progress" ||
    currentPhase === "bidding2_start" ||
    currentPhase === "bidding2_in_progress";

  if (!isBiddingPhase) {
    return (
      <div className="text-center p-4 text-slate-300">
        Waiting for bidding phase...
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="bidding-interface bg-slate-900 text-slate-100 rounded-lg shadow-xl p-4 w-72 absolute z-30 cursor-move border border-slate-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        boxShadow: isDragging
          ? "0 10px 25px -5px rgba(99, 102, 241, 0.5)"
          : "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
        transition: isDragging ? "none" : "box-shadow 0.3s, border-color 0.3s",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Round {round} Bidding
          </h3>
          <div className="w-6" />
        </div>

        <div className="bg-slate-800 rounded-lg p-2 mb-3">
          <p className="text-md font-medium">{currentPlayerName}'s Turn</p>

          {highestBid && !highestBid.isPass && (
            <div className="mt-2 p-2 bg-indigo-900 bg-opacity-60 rounded-md text-sm border border-indigo-700">
              <span>Current Highest: </span>
              <span className="font-bold text-indigo-300">
                {highestBid.amount} {highestBid.isHonors ? "★" : ""}
              </span>
              <div className="text-xs text-slate-400 mt-1">
                You must bid higher than this value
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bid-amounts grid grid-cols-5 gap-1 mb-4">
        {availableBids.map((amount) => (
          <button
            key={amount}
            className={`py-2 px-1 text-sm rounded-md transition-all duration-150 ${
              selectedBid === amount
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-110 font-medium"
                : amount >= honorsThreshold
                ? "bg-purple-800 text-white hover:bg-purple-700 hover:scale-105"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:scale-105"
            }`}
            onClick={() => handleBidClick(amount)}
          >
            {amount}
            {amount >= honorsThreshold ? "★" : ""}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          className="bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-md hover:shadow-lg"
          onClick={handlePass}
          data-testid="pass-button"
        >
          Pass
        </button>

        <button
          className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium shadow-md ${
            selectedBid === null
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg"
          }`}
          onClick={handleSubmitBid}
          disabled={selectedBid === null}
          data-testid="submit-bid-button"
        >
          Bid {selectedBid || ""} {isHonors ? "★" : ""}
        </button>
      </div>
    </div>
  );
};

export default BiddingInterface;
