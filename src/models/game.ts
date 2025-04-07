import { Card, Suit } from './card';
import { Player } from './player';
import { Bid } from './bid';

export type GamePhase =
    'setup' |
    'dealing1' |
    'bidding1_start' | // Start of first bidding round
    'bidding1_in_progress' | // During first bidding round
    'bidding1_complete' | // First round bidding done, awaiting provisional trump selection
    'trump_selection_provisional' | // Bidder 1 selecting provisional trump
    'dealing2' |
    'bidding2_start' | // Start of second bidding round
    'bidding2_in_progress' | // During second bidding round
    'bidding2_complete' | // Second round bidding done, awaiting final trump selection
    'trump_selection_final' | // Final declarer selecting final trump
    'playing_start_trick' | // Start of a trick
    'playing_in_progress' | // During a trick
    'trick_completed_awaiting_confirmation' | // Trick is complete but waiting for confirmation
    'round_over' |
    'game_over';

export interface Trick {
    cards: Card[];          // Cards played in the trick
    playedBy: string[];     // Player IDs corresponding to cards array
    leaderId: string;       // Player who led the trick
    leadSuit: Suit;         // Suit that was led
    winnerId?: string;      // Player who won the trick (if completed)
    timestamp: number;      // When trick started
    points: number;         // Points in the trick
    playerWhoAskedTrump?: string | null; // ID of player who asked for reveal this trick
}

export interface TrumpState {
    provisionalTrumpCardId?: string; // ID of the card folded in round 1 bidding
    provisionalTrumpSuit?: Suit;     // Suit of provisional trump
    finalTrumpCardId?: string;       // ID of the card folded in final trump selection
    finalTrumpSuit?: Suit;          // Final trump suit for the round
    trumpRevealed: boolean;         // Whether trump has been revealed
    provisionalBidderId?: string;   // ID of player who won first bidding round
    finalDeclarerId?: string;       // ID of final declarer
    declarerChoseKeep?: boolean;    // Tracks if declarer explicitly chose to keep provisional trump
    declarerChoseNew?: boolean;     // Tracks if declarer explicitly chose a new trump
    foldedCardReturned?: boolean;    // Tracks if the folded card has been returned to declarer's hand
}

export interface RoundScore {
    roundNumber: number;
    declarerPoints: number;         // Points collected by declarer/team
    opponentPoints: number;         // Points collected by opponents
    contract: number;               // Final bid amount
    bid1Amount?: number;            // First round bid amount (if relevant)
    bid2Amount?: number;            // Second round bid amount (if relevant)
    isHonors: boolean;              // Whether final bid was an honors bid
    declarerWon: boolean;           // Whether declarer made the contract
    gamePointsChange: number;       // Game points awarded/deducted
    stakesChange?: number;          // Optional: stakes exchanged based on rules
    timestamp: number;              // When round was completed
}

export interface GameScore {
    player1Points: number;  // For 3p
    player2Points: number;  // For 3p
    player3Points: number;  // For 3p
    team1Points?: number;   // For 4p (players 0,2)
    team2Points?: number;   // For 4p (players 1,3)
}

export interface GameState {
    id: string;               // Unique game ID
    createdAt: number;        // Timestamp when game was created
    gameMode: '3p' | '4p';    // 3 or 4 player mode
    currentPhase: GamePhase;  // Current game phase
    roundNumber: number;      // Current round number

    players: Player[];        // Array of players
    currentPlayerIndex: number; // Index of player whose turn it is
    dealerIndex: number;      // Index of dealer
    originalBidderIndex: number; // Index of original bidder (right of dealer)

    deck: Card[];             // Current deck of cards
    // Keep track of folded cards separately from the deck and player hands
    foldedCard?: Card;         // The actual card currently folded (for server-side logic)

    // Bidding state
    bids1: Bid[];             // First round bids
    bids2: Bid[];             // Second round bids
    highestBid1?: Bid;        // Highest bid from round 1
    highestBid2?: Bid;        // Highest bid from round 2
    finalBid?: Bid;           // Final winning bid

    // Trump state
    trumpState: TrumpState;

    // Playing state
    currentTrick: Trick | null; // Current trick in progress (can be null between tricks)
    completedTricks: Trick[]; // Completed tricks this round
    completedTrickAwaitingConfirmation?: Trick; // Completed trick waiting for confirmation

    // Scoring
    roundScores: RoundScore[]; // Scores for completed rounds
    gameScores: GameScore;    // Cumulative game scores

    // Target score to end game
    targetScore: number;      // Game ends when a player/team reaches this

    // Metadata
    isOnline: boolean;        // Whether this is an online game (Phase 2)
    status: 'waiting' | 'active' | 'completed' | 'abandoned'; // Game status
}