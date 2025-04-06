import React, { useState } from "react";
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

  // Generate available bid amounts based on game rules
  const generateBidAmounts = (): number[] => {
    const minBid = round === 1 ? 14 : 14;
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
    onBid(null, false);
  };

  // Determine if the bidding phase is active
  const isBiddingPhase =
    currentPhase === "bidding1_start" ||
    currentPhase === "bidding1_in_progress" ||
    currentPhase === "bidding2_start" ||
    currentPhase === "bidding2_in_progress";

  if (!isBiddingPhase) {
    return (
      <div className="text-center p-4">Waiting for bidding to start...</div>
    );
  }

  return (
    <div className="bidding-interface bg-white rounded-lg shadow-md p-4 w-full max-w-lg mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold">Round {round} Bidding</h3>
        <p className="text-gray-600">{currentPlayerName}'s Turn to Bid</p>

        {highestBid && !highestBid.isPass && (
          <div className="mt-2 p-2 bg-blue-100 rounded">
            <span className="font-medium">Current Highest Bid: </span>
            <span className="font-bold text-blue-700">
              {highestBid.amount} {highestBid.isHonors ? "(Honors)" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="bid-amounts grid grid-cols-4 gap-2 mb-4">
        {availableBids.map((amount) => (
          <button
            key={amount}
            className={`py-2 px-3 rounded ${
              selectedBid === amount
                ? "bg-blue-600 text-white"
                : amount >= honorsThreshold
                ? "bg-purple-100 border border-purple-300 hover:bg-purple-200"
                : "bg-gray-100 border border-gray-300 hover:bg-gray-200"
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
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          onClick={handlePass}
        >
          Pass
        </button>

        <button
          className={`bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded ${
            selectedBid === null ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleSubmitBid}
          disabled={selectedBid === null}
        >
          Bid {selectedBid} {isHonors ? "(Honors)" : ""}
        </button>
      </div>

      {round === 1 && (
        <div className="mt-4 text-gray-600 text-sm">
          <p>
            After winning Round 1 bidding, you'll select a card to fold that
            sets the provisional trump suit.
          </p>
        </div>
      )}

      {round === 2 && (
        <div className="mt-4 text-gray-600 text-sm">
          <p>
            After winning Round 2 bidding, you'll be the declarer and can choose
            to keep or change the trump suit.
          </p>
        </div>
      )}
    </div>
  );
};

export default BiddingInterface;
