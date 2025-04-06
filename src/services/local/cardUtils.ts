import { Card, Rank, Suit } from '../../models/card';
import { TrumpState } from '../../models/game';
import { Trick } from '../../models/game';

/**
 * Generate a standard deck of cards based on game mode
 */
export const generateDeck = (gameMode: '3p' | '4p'): Card[] => {
    const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    let ranks: Rank[];

    // 3-player mode uses A, K, Q, J, 10, 9 (24 cards)
    // 4-player mode uses A, K, Q, J, 10, 9, 8, 7 (32 cards)
    if (gameMode === '3p') {
        ranks = ['A', 'K', 'Q', 'J', '10', '9'];
    } else {
        ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
    }

    const deck: Card[] = [];

    // Card order within suit (highest to lowest): J, 9, A, 10, K, Q, (8, 7 for 4p)
    const rankOrder: Record<Rank, number> = {
        'J': 8, '9': 7, 'A': 6, '10': 5, 'K': 4, 'Q': 3, '8': 2, '7': 1
    };

    // Point values: J=3, 9=2, A=1, 10=1, others=0
    const pointValues: Record<Rank, number> = {
        'J': 3, '9': 2, 'A': 1, '10': 1, 'K': 0, 'Q': 0, '8': 0, '7': 0
    };

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                id: `${suit[0]}${rank}`, // e.g., 'HJ' for Jack of Hearts
                suit,
                rank,
                pointValue: pointValues[rank],
                order: rankOrder[rank]
            });
        }
    }

    return deck;
};

/**
 * Shuffle a deck of cards using Fisher-Yates algorithm
 */
export const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

/**
 * Deal cards from a deck to players
 */
export const dealCards = (
    deck: Card[],
    playerCount: number,
    cardsPerPlayer: number
): { hands: Card[][], remainingDeck: Card[] } => {
    const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
    const currentDeck = [...deck];

    // Deal cards one at a time to each player
    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let p = 0; p < playerCount; p++) {
            if (currentDeck.length > 0) {
                const card = currentDeck.shift()!;
                hands[p].push(card);
            }
        }
    }

    return { hands, remainingDeck: currentDeck };
};

/**
 * Calculate points in a set of cards
 */
export const calculateCardPoints = (cards: Card[]): number => {
    return cards.reduce((sum, card) => sum + card.pointValue, 0);
};

/**
 * Determine if a card is a valid play
 */
export const isValidPlay = (
    card: Card,
    playerId: string,
    hand: Card[],
    currentTrick: Trick,
    trumpState: TrumpState,
    finalDeclarerId?: string
): boolean => {
    const { finalTrumpSuit, trumpRevealed } = trumpState;
    const isDeclarer = playerId === finalDeclarerId;

    // Leading a trick?
    if (currentTrick.cards.length === 0) {
        // Prevent DECLARER from leading with unrevealed trump
        if (isDeclarer && !trumpRevealed && finalTrumpSuit && card.suit === finalTrumpSuit) {
            return false;
        }
        return true; // Allowed otherwise
    }

    // Following suit?
    const leadSuit = currentTrick.leadSuit;
    const hasLeadSuit = hand.some(c => c.suit === leadSuit);

    if (hasLeadSuit) {
        // Must follow suit if possible
        return card.suit === leadSuit;
    } else {
        // Cannot follow suit
        const hasTrump = finalTrumpSuit ? hand.some(c => c.suit === finalTrumpSuit) : false;

        if (trumpRevealed) {
            // Trump is revealed.
            // Check if the CURRENT player is the one who ASKED for the reveal THIS trick.
            const playerAskedThisTrick = playerId === currentTrick.playerWhoAskedTrump;

            if (playerAskedThisTrick && hasTrump) {
                // If this player asked and has trump, they MUST play trump.
                return card.suit === finalTrumpSuit;
            } else {
                // Otherwise (either didn't ask, or asked but has no trump),
                // the general rule applies: MAY play trump or discard.
                // Any card is valid in this case.
                return true;
            }
        } else {
            // Trump is not revealed
            // If the player is the declarer and cannot follow suit, they have the OPTION
            // to play trump (ruff) or discard another plain suit card.
            if (isDeclarer) {
                // Any card is a valid play for the declarer in this situation.
                return true;
            } else {
                // Non-declarer can play any card (ruff or discard) if they cannot follow suit.
                // Note: Playing trump might trigger the "Ask Trump?" mechanism later.
                return true;
            }
        }
    }
};

/**
 * Determine the winner of a trick
 */
export const determineTrickWinner = (
    trick: Trick,
    trumpState: TrumpState
): number => {
    const { finalTrumpSuit, trumpRevealed } = trumpState;
    if (trick.cards.length === 0) return -1; // Should not happen for a completed trick

    let winningCardIndex = 0;
    let winningCard = trick.cards[0];

    for (let i = 1; i < trick.cards.length; i++) {
        const currentCard = trick.cards[i];

        // Case 1: Trump is revealed and current card is a trump
        if (trumpRevealed && finalTrumpSuit && currentCard.suit === finalTrumpSuit) {
            // If winning card is not trump, or this trump is higher order (J>9>A>10>K>Q>8>7)
            if (winningCard.suit !== finalTrumpSuit || currentCard.order > winningCard.order) {
                winningCard = currentCard;
                winningCardIndex = i;
            }
        }
        // Case 2: Current card is of the lead suit
        else if (currentCard.suit === trick.leadSuit) {
            // If winning card is not trump (or trump not revealed), and current card is higher order in lead suit
            if (
                (trumpRevealed ? winningCard.suit !== finalTrumpSuit : true) &&
                (winningCard.suit === trick.leadSuit && currentCard.order > winningCard.order)
            ) {
                winningCard = currentCard;
                winningCardIndex = i;
            }
            // If winning card is not lead suit or trump (just a discard)
            else if (winningCard.suit !== trick.leadSuit &&
                (!trumpRevealed || winningCard.suit !== finalTrumpSuit)) {
                winningCard = currentCard;
                winningCardIndex = i;
            }
        }
        // Case 3: Trump is not revealed but declarer played a trump
        else if (!trumpRevealed && finalTrumpSuit && currentCard.suit === finalTrumpSuit) {
            // Declarer's trump always wins if trump not revealed yet
            // (Only the declarer can play trump when it's not revealed)
            winningCard = currentCard;
            winningCardIndex = i;
        }
        // Case 4: Card is neither trump nor lead suit (a discard)
        // In this case, the discard cannot win
    }

    return winningCardIndex;
};

/**
 * Check if a player's hand has any cards of a specific suit
 */
export const canFollowSuit = (hand: Card[], suit: Suit): boolean => {
    return hand.some(card => card.suit === suit);
};

/**
 * Get card image path from card
 */
export const getCardImagePath = (card: Card | null): string => {
    if (!card) return '/src/assets/cards/1B.svg'; // Back of card

    // Map card ID to filename
    const suit = card.suit[0];
    const rank = card.rank === '10' ? 'T' : card.rank;
    return `/src/assets/cards/${rank}${suit}.svg`;
}; 