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

    // If this is the first card of the trick (leading)
    if (currentTrick.cards.length === 0) {
        // Prevent leading with trump if trump is not revealed
        if (!trumpRevealed && finalTrumpSuit && card.suit === finalTrumpSuit) {
            return false; // Cannot lead with unrevealed trump
        }
        return true; // Any other card is valid for leading
    }

    const leadSuit = currentTrick.leadSuit;

    // Check if player has any cards of the lead suit
    const hasSuit = hand.some(c => c.suit === leadSuit);

    // If player has the lead suit, they must play it
    if (hasSuit) {
        return card.suit === leadSuit;
    }

    // If player cannot follow suit:
    const hasTrump = finalTrumpSuit ? hand.some(c => c.suit === finalTrumpSuit) : false;

    // Case 1: Trump suit is known (revealed)
    if (trumpRevealed && finalTrumpSuit) {
        // If player has trump, they MUST play a trump card
        if (hasTrump) {
            return card.suit === finalTrumpSuit;
        } else {
            // If player has no trump, any card is valid (discard)
            return true;
        }
    }
    // Case 2: Trump suit is NOT known (not revealed)
    else {
        // If player is the declarer and has trump, they must play it
        if (isDeclarer && hasTrump) {
            return card.suit === finalTrumpSuit;
        }
        // For non-declarers or if declarer doesn't have trump, any card is valid
        return true;
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