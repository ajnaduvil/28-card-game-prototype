import { Card, Rank, Suit } from '../../models/card';

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