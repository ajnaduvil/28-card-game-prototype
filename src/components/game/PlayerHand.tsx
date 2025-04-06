import React, { useEffect, useState } from "react";
import { Card as CardModel, Suit } from "../../models/card";
import Card from "./Card";
import { Trick, TrumpState } from "../../models/game";
import { isValidPlay, canFollowSuit } from "../../services/local/cardUtils";
import { useGameStore } from "../../store/gameStore";

interface PlayerHandProps {
  hand: CardModel[];
  isCurrentPlayer: boolean;
  currentTrick?: Trick | null;
  trumpState?: TrumpState;
  playerId: string;
  finalDeclarerId?: string;
  hideCards?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isCurrentPlayer,
  currentTrick,
  trumpState,
  playerId,
  finalDeclarerId,
  hideCards = false,
}) => {
  const playCardAction = useGameStore((state) => state.playCard);
  const declarerRevealTrumpAction = useGameStore(
    (state) => state.declarerRevealTrump
  );
  const requestTrumpRevealAction = useGameStore(
    (state) => state.requestTrumpReveal
  );

  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [canAskTrump, setCanAskTrump] = useState<boolean>(false);
  const [leadSuitCards, setLeadSuitCards] = useState<Record<string, boolean>>(
    {}
  );
  const [showDeclarerRevealChoice, setShowDeclarerRevealChoice] =
    useState<boolean>(false);
  const [cardPendingRevealChoice, setCardPendingRevealChoice] =
    useState<CardModel | null>(null);

  useEffect(() => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) {
      setPlayableCards({});
      setCanAskTrump(false);
      setLeadSuitCards({});
      setShowDeclarerRevealChoice(false);
      setCardPendingRevealChoice(null);
      return;
    }

    const playableMap: Record<string, boolean> = {};
    const leadSuitMap: Record<string, boolean> = {};

    hand.forEach((card) => {
      playableMap[card.id] = isValidPlay(
        card,
        playerId,
        hand,
        currentTrick,
        trumpState,
        finalDeclarerId
      );

      if (
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit === card.suit
      ) {
        leadSuitMap[card.id] = true;
      }
    });

    const canFollow =
      currentTrick.cards.length > 0 &&
      canFollowSuit(hand, currentTrick.leadSuit as Suit);

    setCanAskTrump(
      isCurrentPlayer &&
        !canFollow &&
        currentTrick.cards.length > 0 &&
        playerId !== finalDeclarerId &&
        !trumpState.trumpRevealed
    );

    setPlayableCards(playableMap);
    setLeadSuitCards(leadSuitMap);

    if (
      showDeclarerRevealChoice &&
      (!playableMap[cardPendingRevealChoice?.id ?? ""] || !isCurrentPlayer)
    ) {
      setShowDeclarerRevealChoice(false);
      setCardPendingRevealChoice(null);
    }
  }, [
    hand,
    isCurrentPlayer,
    currentTrick,
    trumpState,
    playerId,
    finalDeclarerId,
    showDeclarerRevealChoice,
    cardPendingRevealChoice,
  ]);

  const handleCardClick = (card: CardModel) => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) return;

    if (cardPendingRevealChoice?.id === card.id) {
      setShowDeclarerRevealChoice(false);
      setCardPendingRevealChoice(null);
      setSelectedCard(null);
      return;
    }

    if (playableCards[card.id]) {
      const isDeclarer = playerId === finalDeclarerId;
      const isTrumpCard = card.suit === trumpState.finalTrumpSuit;

      console.log(
        `handleCardClick: Card=${card.id}, isDeclarer=${isDeclarer}, trumpRevealed=${trumpState.trumpRevealed}, isTrumpCard=${isTrumpCard}, finalTrumpSuit=${trumpState.finalTrumpSuit}`
      );

      if (isDeclarer && !trumpState.trumpRevealed && isTrumpCard) {
        console.log(">>> Condition met: Showing declarer reveal choice.");
        setSelectedCard(card);
        setCardPendingRevealChoice(card);
        setShowDeclarerRevealChoice(true);
      } else {
        console.log(">>> Condition NOT met: Playing card directly.");
        playCardAction(playerId, card.id);
        setSelectedCard(null);
        setShowDeclarerRevealChoice(false);
        setCardPendingRevealChoice(null);
      }
    } else {
      setSelectedCard(selectedCard?.id === card.id ? null : card);
      setShowDeclarerRevealChoice(false);
      setCardPendingRevealChoice(null);
    }
  };

  const handleAskTrump = () => {
    requestTrumpRevealAction();
  };

  const handleDeclarerChoice = (reveal: boolean) => {
    if (!cardPendingRevealChoice || !playerId) return;

    if (reveal) {
      declarerRevealTrumpAction(playerId);
    }
    playCardAction(playerId, cardPendingRevealChoice.id);

    setShowDeclarerRevealChoice(false);
    setCardPendingRevealChoice(null);
    setSelectedCard(null);
  };

  if (hand.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">No cards</div>
    );
  }

  return (
    <div className="relative player-hand flex flex-col items-center">
      {canAskTrump && (
        <button
          onClick={handleAskTrump}
          className="mb-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
        >
          Ask Trump?
        </button>
      )}

      {currentTrick &&
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit && (
          <div className="mb-2 px-3 py-1 bg-blue-700 text-white rounded-full text-sm shadow-md font-medium">
            Lead: {currentTrick.leadSuit}
          </div>
        )}

      {/* --- Add Declarer Choice Buttons --- */}
      {showDeclarerRevealChoice && cardPendingRevealChoice && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center space-y-1 bg-gray-800 p-2 rounded shadow-lg">
          <p className="text-white text-xs mb-1">Play Trump:</p>
          <div className="flex space-x-2">
            <button
              onClick={() => handleDeclarerChoice(false)} // Play Hidden
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
            >
              Keep Hidden
            </button>
            <button
              onClick={() => handleDeclarerChoice(true)} // Play & Reveal
              className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
            >
              Reveal Trump
            </button>
          </div>
        </div>
      )}
      {/* --- End Declarer Choice Buttons --- */}

      <div className="flex relative" style={{ height: "135px" }}>
        {hand.map((card, index) => {
          const isPlayable = isCurrentPlayer && playableCards[card.id];
          const isSelected = selectedCard?.id === card.id;
          const isLeadSuit = leadSuitCards[card.id];
          const offset = Math.min(20, 200 / hand.length);

          return (
            <div
              key={card.id}
              className={`absolute transition-all duration-300 ${
                isLeadSuit ? "transform hover:-translate-y-2" : ""
              }`}
              style={{
                left: `${index * offset}px`,
                zIndex: isSelected ? 10 : index,
              }}
            >
              <div className="relative">
                <Card
                  card={hideCards ? undefined : card}
                  isPlayable={isPlayable}
                  isSelectable={isCurrentPlayer}
                  isSelected={isSelected}
                  isLeadSuit={isLeadSuit}
                  onClick={handleCardClick}
                  size="md"
                  showPointValue={isCurrentPlayer && !hideCards}
                  faceDown={hideCards}
                  showBack={hideCards}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;
