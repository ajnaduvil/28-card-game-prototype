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
  const foldedCard = useGameStore((state) => state.foldedCard);

  const [playableCards, setPlayableCards] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [canAskTrump, setCanAskTrump] = useState<boolean>(false);
  const [canDeclarerRevealTrump, setCanDeclarerRevealTrump] =
    useState<boolean>(false);
  const [leadSuitCards, setLeadSuitCards] = useState<Record<string, boolean>>(
    {}
  );
  const [mustPlayFoldedCard, setMustPlayFoldedCard] = useState<boolean>(false);
  const [revealedFoldedCardId, setRevealedFoldedCardId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isCurrentPlayer) {
      setMustPlayFoldedCard(false);
      setRevealedFoldedCardId(null);
    }
  }, [isCurrentPlayer]);

  useEffect(() => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) {
      setPlayableCards({});
      setCanAskTrump(false);
      setCanDeclarerRevealTrump(false);
      setLeadSuitCards({});
      return;
    }

    const playableMap: Record<string, boolean> = {};
    const leadSuitMap: Record<string, boolean> = {};

    if (mustPlayFoldedCard && revealedFoldedCardId) {
      hand.forEach((card) => {
        playableMap[card.id] = card.id === revealedFoldedCardId;
        if (
          currentTrick.cards.length > 0 &&
          currentTrick.leadSuit === card.suit
        ) {
          leadSuitMap[card.id] = true;
        }
      });
    } else {
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
    }

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

    const isLeadSuitTrump =
      currentTrick.cards.length > 0 &&
      currentTrick.leadSuit === trumpState.finalTrumpSuit;

    // For declarer: offer trump reveal when:
    // 1. It's their turn, and
    // 2. Trump is not already revealed, and
    // 3. Either:
    //    a. They can't follow suit (regular case), or
    //    b. The declarer has ONLY the folded card as their only trump card when trump is led

    // Check if declarer has the folded card in hand
    const hasFoldedCard =
      !!foldedCard && hand.some((card) => card.id === foldedCard.id);

    // Count how many trump cards declarer has
    const trumpCardCount = hand.filter(
      (card) => card.suit === trumpState.finalTrumpSuit
    ).length;

    // Determine if declarer has ONLY the folded card as their only trump
    const hasOnlyFoldedTrump =
      hasFoldedCard &&
      trumpCardCount === 1 &&
      foldedCard?.suit === trumpState.finalTrumpSuit;

    setCanDeclarerRevealTrump(
      isCurrentPlayer &&
        playerId === finalDeclarerId &&
        !trumpState.trumpRevealed &&
        trumpState.finalTrumpSuit !== undefined &&
        ((!canFollow && currentTrick.cards.length > 0) ||
          (isLeadSuitTrump && hasOnlyFoldedTrump)) &&
        !mustPlayFoldedCard
    );

    setPlayableCards(playableMap);
    setLeadSuitCards(leadSuitMap);

    // Removed declarer reveal choice check
  }, [
    hand,
    isCurrentPlayer,
    currentTrick,
    trumpState,
    playerId,
    finalDeclarerId,
    mustPlayFoldedCard,
    revealedFoldedCardId,
    foldedCard,
  ]);

  const handleCardClick = (card: CardModel) => {
    if (!isCurrentPlayer || !currentTrick || !trumpState) return;

    if (mustPlayFoldedCard && revealedFoldedCardId) {
      if (card.id === revealedFoldedCardId) {
        playCardAction(playerId, card.id);
        setMustPlayFoldedCard(false);
        setRevealedFoldedCardId(null);
      } else {
        console.log("You must play the revealed folded card.");
      }
      return;
    }

    if (playableCards[card.id]) {
      const isDeclarer = playerId === finalDeclarerId;
      const isTrumpCard = card.suit === trumpState.finalTrumpSuit;
      const isLeadSuitTrump =
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit === trumpState.finalTrumpSuit;
      const isLeadingTrick = currentTrick.cards.length === 0;

      console.log(
        `handleCardClick: Card=${card.id}, isDeclarer=${isDeclarer}, trumpRevealed=${trumpState.trumpRevealed}, isTrumpCard=${isTrumpCard}, finalTrumpSuit=${trumpState.finalTrumpSuit}, isLeadSuitTrump=${isLeadSuitTrump}, isLeadingTrick=${isLeadingTrick}`
      );

      // Always play the card directly without showing the reveal choice popup
      console.log("Playing card directly.");
      playCardAction(playerId, card.id);
      setSelectedCard(null);
    } else {
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  const handleAskTrump = () => {
    requestTrumpRevealAction();
  };

  const handleDeclarerRevealTrump = () => {
    if (declarerRevealTrumpAction(playerId) && foldedCard) {
      console.log(
        "Trump revealed. Declarer must now play the folded card:",
        foldedCard.id
      );
      setMustPlayFoldedCard(true);
      setRevealedFoldedCardId(foldedCard.id);
      setCanDeclarerRevealTrump(false);
    }
  };

  // Removed handleDeclarerChoice function as it's no longer needed

  if (hand.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">No cards</div>
    );
  }

  return (
    <div className="relative player-hand flex flex-col items-center">
      {canAskTrump && (
        <button
          type="button"
          onClick={handleAskTrump}
          className="mb-2 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
        >
          Ask Trump?
        </button>
      )}

      {canDeclarerRevealTrump && (
        <button
          type="button"
          onClick={handleDeclarerRevealTrump}
          className="mb-2 bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded text-sm"
        >
          Reveal Trump
        </button>
      )}

      {mustPlayFoldedCard && revealedFoldedCardId && (
        <div className="mb-2 bg-red-500 text-white py-1 px-3 rounded text-sm animate-pulse">
          Play the revealed folded card
        </div>
      )}

      {currentTrick &&
        currentTrick.cards.length > 0 &&
        currentTrick.leadSuit && (
          <div className="mb-2 px-3 py-1 bg-blue-700 text-white rounded-full text-sm shadow-md font-medium">
            Lead: {currentTrick.leadSuit}
          </div>
        )}

      {/* Removed declarer reveal choice UI */}

      <div className="flex relative" style={{ height: "135px" }}>
        {hand.map((card, index) => {
          const isFoldedCard =
            mustPlayFoldedCard && card.id === revealedFoldedCardId;
          const isPlayable = isCurrentPlayer && playableCards[card.id];
          const isSelected = selectedCard?.id === card.id;
          const isLeadSuit = leadSuitCards[card.id];
          const offset = Math.min(20, 200 / hand.length);

          return (
            <div
              key={card.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${index * offset}px`,
                zIndex: isSelected ? 10 : isPlayable ? 5 : index,
                transform: isPlayable ? "translateY(-8px)" : "none",
              }}
            >
              <div className="relative">
                {isFoldedCard && (
                  <div className="absolute -inset-1 bg-purple-500 opacity-50 rounded-lg animate-pulse"></div>
                )}
                {isPlayable && !isFoldedCard && (
                  <div className="absolute -inset-0.5 bg-green-500 opacity-20 rounded-lg animate-pulse"></div>
                )}
                <Card
                  card={hideCards ? undefined : card}
                  isPlayable={isPlayable}
                  isSelectable={isCurrentPlayer}
                  isSelected={isSelected}
                  isLeadSuit={isLeadSuit}
                  onClick={handleCardClick}
                  size="md"
                  showPointValue={false}
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
