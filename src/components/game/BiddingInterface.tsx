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
      <div className="text-center p-2">Waiting for bidding to start...</div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="bidding-interface bg-gray-800 text-white rounded-lg shadow-md p-2 w-64 absolute z-20 bg-opacity-90 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        border: isDragging ? "2px solid #4299e1" : "2px solid transparent",
        transition: isDragging ? "none" : "border-color 0.2s",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="text-center mb-2">
        <div className="flex justify-between items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 ml-1" />
          <h3 className="text-lg font-bold">Round {round} Bidding</h3>
          <div className="w-4" />
        </div>
        <p className="text-sm text-gray-300">{currentPlayerName}'s Turn</p>

        {highestBid && !highestBid.isPass && (
          <div className="mt-1 p-1 bg-blue-900 rounded text-sm">
            <span>Highest: </span>
            <span className="font-bold text-blue-300">
              {highestBid.amount} {highestBid.isHonors ? "★" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="bid-amounts grid grid-cols-5 gap-1 mb-2">
        {availableBids.map((amount) => (
          <button
            key={amount}
            className={`py-1 px-2 text-sm rounded cursor-pointer ${
              selectedBid === amount
                ? "bg-blue-600 text-white"
                : amount >= honorsThreshold
                ? "bg-purple-700 text-white hover:bg-purple-600"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
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
          className="bg-red-700 hover:bg-red-600 text-white py-1 px-3 rounded text-sm cursor-pointer"
          onClick={handlePass}
          data-testid="pass-button"
        >
          Pass
        </button>

        <button
          className={`bg-green-700 hover:bg-green-600 text-white py-1 px-3 rounded text-sm ${
            selectedBid === null
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          onClick={handleSubmitBid}
          disabled={selectedBid === null}
          data-testid="submit-bid-button"
        >
          Bid {selectedBid} {isHonors ? "★" : ""}
        </button>
      </div>
    </div>
  );
};

export default BiddingInterface;
