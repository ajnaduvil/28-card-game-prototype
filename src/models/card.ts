export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7';

export interface Card {
    id: string;         // Unique identifier (e.g., 'H9' for 9 of Hearts)
    suit: Suit;
    rank: Rank;
    pointValue: number; // Point value (J=3, 9=2, A=1, 10=1, others=0)
    order: number;      // Card order within suit for comparison (J=8, 9=7, A=6, etc.)
    imageUrl?: string;  // Path to card image asset
} 