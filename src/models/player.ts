import { Card } from './card';
import { Trick } from './game';

export interface Player {
    id: string;
    name: string;
    position: number;     // 0, 1, 2 (for 3p) or 0, 1, 2, 3 (for 4p)
    hand: Card[];         // Cards currently held by the player (updated dynamically)
    initialHand?: Card[]; // Store the initial 4 cards for provisional trump selection reference if needed
    activeCardCount?: number; // Number of active cards (excluding folded trump)
    isDealer: boolean;    // Whether this player is the dealer
    isOriginalBidder: boolean; // Whether this player is the original bidder (to dealer's right)
    tricksWon: Trick[];   // Array of completed Trick objects won by this player/team
    team?: number;        // 0 or 1 (for 4p mode - partners are (0,2) and (1,3))
    hasPassedCurrentRound: boolean; // Tracks if player passed in the current bidding round
    hasPassedRound1?: boolean;      // Specifically tracks if player passed permanently in Round 1
    isConnected?: boolean; // Connection status (for Phase 2)
}
