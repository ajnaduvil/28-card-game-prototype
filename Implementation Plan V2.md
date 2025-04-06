# 28 Card Game Implementation Plan

This implementation plan outlines a modular, phased approach to developing the 28 card game. The plan is structured to allow offline development of core game functionality first, with Firebase integration for authentication and multiplayer features in a later phase.

## Phase 1: Core Game Logic and Local Multiplayer

In this phase, we'll focus on building the core game mechanics and a local multiplayer experience that can be played on a single device. This approach allows for development and testing without requiring internet connectivity or backend services.

### Step 1: Project Setup and Basic Structure

1. **Initialize React Project with Vite**
   - Use TypeScript for type safety
   - Set up project structure with Vite: `yarn create vite 28-card-game --template react-ts`
   - Configure ESLint and Prettier for code quality
   - Add TypeScript strict mode configuration in tsconfig.json

2. **Install Core Dependencies**
   - Tailwind CSS and DaisyUI for styling
     - `yarn add -D tailwindcss postcss autoprefixer daisyui`
     - Create and configure tailwind.config.js and postcss.config.js
   - Zustand for state management
     - `yarn add zustand immer`
   - React Router for navigation
     - `yarn add react-router-dom`
   - Framer Motion for animations
     - `yarn add framer-motion`
   - Additional utilities
     - `yarn add clsx class-variance-authority`

3. **Create Basic Project Structure**
   ```
   src/
   ├── assets/              # Images, fonts, card SVGs
   │   ├── images/          # General images
   │   ├── cards/           # Card SVGs or images
   ├── components/          # Reusable UI components
   │   ├── ui/              # Basic UI elements (buttons, inputs, etc.)
   │   ├── game/            # Game-specific components
   │   ├── auth/            # Authentication components (for Phase 2)
   │   └── layout/          # Layout components
   ├── hooks/               # Custom React hooks
   ├── models/              # TypeScript interfaces and types
   │   ├── card.ts          # Card and deck related types
   │   ├── player.ts        # Player related types
   │   ├── game.ts          # Game state types
   │   ├── bid.ts           # Bidding related types
   │   └── user.ts          # User profile types (for Phase 2)
   ├── services/            # Service layer
   │   ├── local/           # Local game services (Phase 1)
   │   │   ├── gameEngine.ts    # Core game logic
   │   │   ├── storageService.ts # Local storage functionality
   │   │   └── cardUtils.ts      # Card utility functions
   │   └── firebase/        # Firebase services (Phase 2)
   ├── store/               # Zustand stores
   │   ├── gameStore.ts     # Game state store
   │   ├── authStore.ts     # Auth state store (Phase 2)
   │   └── uiStore.ts       # UI state store
   ├── utils/               # Utility functions
   │   ├── animations.ts    # Animation utilities
   │   ├── validators.ts    # Input validation
   │   └── helpers.ts       # General helper functions
   ├── pages/               # Page components
   │   ├── Home.tsx         # Landing page
   │   ├── GameSetup.tsx    # Game setup page
   │   ├── GamePlay.tsx     # Main game play page
   │   ├── Lobby.tsx        # Game lobby (Phase 2)
   │   ├── Profile.tsx      # User profile (Phase 2)
   │   └── Auth.tsx         # Authentication page (Phase 2)
   ├── routes/              # Route definitions
   ├── App.tsx              # Main App component
   └── main.tsx             # Entry point
   ```

### Step 2: Core Game Models and Types

1. **Define Core Game Types**
   - Create TypeScript interfaces for the complete game state:

   ```typescript
   // src/models/card.ts
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

   // src/models/player.ts
   export interface Player {
     id: string;
     name: string;
     position: number;     // 0, 1, 2 (for 3p) or 0, 1, 2, 3 (for 4p)
     hand: Card[];         // Cards currently held by the player (updated dynamically)
     initialHand?: Card[]; // Store the initial 4 cards for provisional trump selection reference if needed
     // activeCardCount can be derived from hand.length, folded card state, etc.
     isDealer: boolean;    // Whether this player is the dealer
     isOriginalBidder: boolean; // Whether this player is the original bidder (to dealer's right)
     tricksWon: Trick[];   // Array of completed Trick objects won by this player/team
     team?: number;        // 0 or 1 (for 4p mode - partners are (0,2) and (1,3))
     hasPassedCurrentRound: boolean; // Tracks if player passed in the current bidding round
     hasPassedRound1?: boolean;    // Specifically tracks if player passed permanently in Round 1
     isConnected?: boolean; // Connection status (for Phase 2)
   }

   // src/models/bid.ts
   export interface Bid {
     amount: number;
     playerId: string;
     isPass: boolean;
     isHonors: boolean;  // Whether this is an "honors" bid (>18 for 3p, >20 for 4p)
     timestamp: number;  // For ordering
   }

   // src/models/game.ts
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
     
     // Scoring
     roundScores: RoundScore[]; // Scores for completed rounds
     gameScores: GameScore;    // Cumulative game scores
     
     // Target score to end game
     targetScore: number;      // Game ends when a player/team reaches this
     
     // Metadata
     isOnline: boolean;        // Whether this is an online game (Phase 2)
     status: 'waiting' | 'active' | 'completed' | 'abandoned'; // Game status
   }
   ```

2. **Implement Card Utilities**
   - Create utility functions for card operations:

   ```typescript
   // src/services/local/cardUtils.ts
   
   // Generate a standard deck of cards
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
   
   // Shuffle a deck of cards using Fisher-Yates algorithm
   export const shuffleDeck = (deck: Card[]): Card[] => {
     const newDeck = [...deck];
     for (let i = newDeck.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
     }
     return newDeck;
   };
   
   // Deal cards from a deck to players
   export const dealCards = (
     deck: Card[], 
     playerCount: number, 
     cardsPerPlayer: number
   ): { hands: Card[][], remainingDeck: Card[] } => {
     const hands: Card[][] = Array(playerCount).fill(null).map(() => []);
     let currentDeck = [...deck];
     
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
   
   // Determine if a card is a valid play
   export const isValidPlay = (
     card: Card,
     playerId: string, // Added player ID to check against declarer
     hand: Card[],
     currentTrick: Trick,
     trumpState: TrumpState, // Pass the whole trump state object
     finalDeclarerId?: string // Pass declarer ID
   ): boolean => {
     const { finalTrumpSuit, trumpRevealed } = trumpState;
     const isDeclarer = playerId === finalDeclarerId;
     
     // If this is the first card of the trick, any card is valid
     if (currentTrick.cards.length === 0) return true;
     
     const leadSuit = currentTrick.leadSuit;
     
     // Check if player has any cards of the lead suit
     const hasSuit = hand.some(c => c.suit === leadSuit);
     
     // If player has the lead suit, they must play it
     if (hasSuit) {
       return card.suit === leadSuit;
     }
     
     // If player cannot follow suit:
     const hasTrump = hand.some(c => c.suit === finalTrumpSuit);
     
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
       // Player can play any card (trump or discard), but playing trump doesn't reveal it yet
       // Exception: Declarer MUST play trump if they have it and cannot follow suit,
       // potentially revealing it implicitly (handled in playCard logic).
       // Non-declarers can choose to play trump or discard.
       // For validation here, any card is technically playable if suit cannot be followed and trump isn't revealed.
       return true;
     }
   };
   
   // Determine the winner of a trick
   export const determineTrickWinner = (
     trick: Trick, 
     trumpState: TrumpState // Pass the whole trump state object
   ): number => {
     const { finalTrumpSuit, trumpRevealed } = trumpState;
     if (trick.cards.length === 0) return -1; // Should not happen for a completed trick
     
     let winningCardIndex = 0;
     let winningCard = trick.cards[0];
     
     for (let i = 1; i < trick.cards.length; i++) {
       const currentCard = trick.cards[i];
       
       // If trump is revealed and this is a trump card
       if (trumpRevealed && finalTrumpSuit && currentCard.suit === finalTrumpSuit) {
         // If the winning card is not trump, or this trump is higher
         if (winningCard.suit !== finalTrumpSuit || currentCard.order > winningCard.order) {
           winningCard = currentCard;
           winningCardIndex = i;
         }
       }
       // If the current card is of the lead suit (and not trump, or trump not revealed/applicable)
       else if (currentCard.suit === trick.leadSuit) { 
         // If winning card is not trump and this card is higher
         if (winningCard.suit === trick.leadSuit && currentCard.order > winningCard.order) {
           winningCard = currentCard;
           winningCardIndex = i;
         } 
         // If the current winning card is NOT of the lead suit (must be an unrevealed trump), 
         // the lead suit card cannot beat it.
         else if (winningCard.suit !== trick.leadSuit && winningCard.suit !== finalTrumpSuit) { 
             // This case handles when the first card played was potentially an unrevealed trump.
             // If the current card follows the actual lead suit, it might win if the first card wasn't trump.
             // However, for simplicity and following common play, we assume the first card establishes the suit unless trump is revealed.
             // Let's stick to: if winning card is lead suit, compare; otherwise, lead suit card loses to the current winner.
         }
       }
     }
     
     return winningCardIndex;
   };
   
   // Calculate points in a set of cards
   export const calculateCardPoints = (cards: Card[]): number => {
     return cards.reduce((sum, card) => sum + card.pointValue, 0);
   };
   ```

### Step 3: Game Logic Implementation

1. **Game State Management with Zustand**
   - Create a Zustand store for game state management:
   ```typescript
   // src/store/gameStore.ts
   import create from 'zustand';
   import { immer } from 'zustand/middleware/immer';
   import { generateDeck, shuffleDeck, dealCards } from '../services/local/cardUtils';
   import type { GameState, Player, Card, Bid, Trick, GamePhase } from '../models';

   export const useGameStore = create(
     immer<GameState & GameActions>((set, get) => ({
       // Initial state
       id: '',
       createdAt: Date.now(),
       gameMode: '4p',
       currentPhase: 'setup',
       roundNumber: 1,
       players: [],
       currentPlayerIndex: 0,
       dealerIndex: 0,
       originalBidderIndex: 0,
       deck: [],
       bids1: [],
       bids2: [],
       trumpState: { trumpRevealed: false },
       currentTrick: null,
       completedTricks: [],
       roundScores: [],
       gameScores: { player1Points: 0, player2Points: 0, player3Points: 0 },
       targetScore: 8, // Default target score to win the game
       isOnline: false,
       status: 'waiting',
       
       // Actions
       initializeGame: (playerNames, gameMode = '4p') => {
         set(state => {
           // Initialize the game state based on player count
           state.gameMode = gameMode;
           state.currentPhase = 'setup';
           state.roundNumber = 1;
           
           // Create players
           const playerCount = gameMode === '3p' ? 3 : 4;
           state.players = playerNames.slice(0, playerCount).map((name, index) => ({
             id: `player-${index}`,
             name,
             position: index,
             hand: [],
             initialHand: [],
             isDealer: index === 0, // First player is initial dealer
             isOriginalBidder: index === 1, // Player to right of dealer starts bidding
             tricksWon: [],
             // In 4p mode, players 0,2 are team 0 and players 1,3 are team 1
             team: gameMode === '4p' ? index % 2 : undefined,
             hasPassedCurrentRound: false,
             hasPassedRound1: index === 1,
             isConnected: index === 0
           }));
           
           state.dealerIndex = 0;
           state.originalBidderIndex = 1; // Right of dealer
           state.currentPlayerIndex = 1; // Original bidder starts
           
           // Reset scores if new game
           if (gameMode === '3p') {
             state.gameScores = { player1Points: 0, player2Points: 0, player3Points: 0 };
           } else {
             state.gameScores = { 
               player1Points: 0, player2Points: 0, player3Points: 0, 
               team1Points: 0, team2Points: 0 
             };
           }
           
           state.status = 'active';
         });
         
         // Start the first round
         get().startRound();
       },
       
       startRound: () => {
         set(state => {
           // Generate and shuffle deck based on game mode
           const newDeck = shuffleDeck(generateDeck(state.gameMode));
           state.deck = newDeck;
           
           // Reset bidding and trump state
           state.bids1 = [];
           state.bids2 = [];
           state.highestBid1 = undefined;
           state.highestBid2 = undefined;
           state.finalBid = undefined;
           
           state.trumpState = { trumpRevealed: false };
           
           // Reset trick state
           state.currentTrick = null;
           state.completedTricks = [];
           
           // Deal first batch of 4 cards
           state.currentPhase = 'dealing1';
           const { hands, remainingDeck } = dealCards(newDeck, state.players.length, 4);
           
           // Update player hands
           state.players.forEach((player, index) => {
             player.hand = hands[index];
             player.initialHand = hands[index];
             player.activeCardCount = 4;
           });
           
           state.deck = remainingDeck;
           state.currentPhase = 'bidding1_start';
         });
       },
       
       // Additional actions to be implemented...
     }))
   );
   ```

2. **Core Game Rules Implementation**

   - **Bidding Rules and Validation with Honors Detection**:
     - Implement functions to validate and process bids with explicit honors bid handling:
     ```typescript
     // Check if a bid qualifies as honors (based on game mode and amount)
     const isHonorsBid = (amount: number, gameMode: '3p' | '4p', currentPhase: GamePhase): boolean => {
       // Honors bids only apply in the first bidding round
       if (currentPhase !== 'bidding1_start') return false;
       
       // In 3-player mode, bids over 18 are honors
       if (gameMode === '3p') return amount > 18;
       
       // In 4-player mode, bids over 20 are honors
       return amount > 20;
     };
     
     // Check if a bid is valid with complete rule implementation
     const isValidBid = (
       amount: number, 
       currentPhase: GamePhase,
       gameMode: '3p' | '4p',
       highestBid?: Bid
     ): boolean => {
       // Pass is always valid
       if (amount === 0) return true;
       
       // Basic validation: must be between 14-28
       if (!Number.isInteger(amount) || amount < 14 || amount > 28) return false;
       
       // If this is round 2 bidding
       if (currentPhase === 'bidding2_start') {
         const minBid = gameMode === '3p' ? 22 : 24;
         
         // If there's no highest bid from round 1, enforce minimum bid
         if (!highestBid) return amount >= minBid;
         
         // If highest bid from round 1 is less than minimum, enforce minimum
         if (highestBid.amount < minBid) return amount >= minBid;
         
         // Otherwise, must be higher than highest bid
         return amount > highestBid.amount;
       }
       
       // In round 1, just needs to be higher than previous
       return !highestBid || amount > highestBid.amount;
     };
     
     // Place bid action
     placeBid: (amount: number) => {
       const state = get();
       const { 
         currentPhase, currentPlayerIndex, players, 
         gameMode, bids1, bids2, highestBid1, highestBid2 
       } = state;
       
       const currentBids = currentPhase === 'bidding1_start' ? bids1 : bids2;
       const highestBid = currentPhase === 'bidding1_start' ? highestBid1 : highestBid2;
       
       // Validate bid
       if (!isValidBid(amount, currentPhase, gameMode, highestBid)) {
         console.error('Invalid bid');
         return false;
       }
       
       // Create bid object with proper honors detection
       const bid: Bid = {
         amount,
         playerId: players[currentPlayerIndex].id,
         isPass: amount === 0,
         isHonors: isHonorsBid(amount, gameMode, currentPhase),
         timestamp: Date.now()
       };
       
       set(state => {
         // Add bid to appropriate array
         if (currentPhase === 'bidding1_start') {
           state.bids1.push(bid);
           if (!bid.isPass && (!highestBid1 || bid.amount > highestBid1.amount)) {
             state.highestBid1 = bid;
           }
         } else {
           state.bids2.push(bid);
           if (!bid.isPass && (!highestBid2 || bid.amount > highestBid2.amount)) {
             state.highestBid2 = bid;
           }
         }
         
         // Move to next player
         state.currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
         
         // Check for bidding completion
         checkBiddingCompletion(state);
       });
       
       return true;
     },
     
     // Pass bid action
     passBid: () => get().placeBid(0),
     ```

   - **Trump Reveal Mechanism with Detailed Implementation**:
     ```typescript
     // Request trump reveal function for non-declarer players
     requestTrumpReveal: () => {
       const state = get();
       const { currentPhase, currentPlayerIndex, players, currentTrick, trumpState } = state;
       
       // Validate it's playing phase
       if (currentPhase !== 'playing_start_trick') {
         console.error('Trump can only be revealed during the playing phase');
         return false;
       }
       
       // Validate current player is not the declarer
       const currentPlayer = players[currentPlayerIndex];
       if (currentPlayer.id === trumpState.finalDeclarerId) {
         console.error('Declarer cannot request trump reveal');
         return false;
       }
       
       // Validate trump is not already revealed
       if (trumpState.trumpRevealed) {
         console.error('Trump is already revealed');
         return false;
       }
       
       // Validate player cannot follow suit
       const leadSuit = currentTrick.leadSuit;
       const canFollowSuit = currentPlayer.hand.some(card => card.suit === leadSuit);
       if (canFollowSuit) {
         console.error('Player can follow suit, cannot request trump reveal');
         return false;
       }
       
       set(state => {
         // Reveal trump
         state.trumpState.trumpRevealed = true;
         
         // Find declarer
         const declarerIndex = state.players.findIndex(p => p.id === state.trumpState.finalDeclarerId);
         
         // If declarer folded a trump card (and didn't keep provisional), return it to their hand
         if (!state.trumpState.declarerChoseKeep && state.trumpState.finalTrumpCardId) {
           state.players[declarerIndex].hand.push(state.trumpState.finalTrumpCard);
           state.players[declarerIndex].activeCardCount++;
           state.trumpState.finalTrumpCardId = undefined;
         }
       });
       
       return true;
     },
     
     // Play a card action with implicit declarer trump reveal logic
     playCard: (card: Card) => {
       const state = get();
       const { 
         currentPhase, currentPlayerIndex, players, 
         currentTrick, trumpState, completedTricks 
       } = state;
       
       // Validate phase is playing
       if (currentPhase !== 'playing_in_progress') {
         console.error('Can only play cards during playing phase');
         return false;
       }
       
       const currentPlayer = players[currentPlayerIndex];
       
       // Validate card is in player's hand
       const cardIndex = currentPlayer.hand.findIndex(c => c.id === card.id);
       if (cardIndex === -1) {
         console.error('Card not in player hand');
         return false;
       }
       
       // Check if card is valid to play based on trick
       if (!isValidPlay(
         card, 
         currentPlayer.hand, 
         currentTrick, 
         trumpState, 
         state.trumpState.finalDeclarerId
       )) {
         console.error('Invalid card play - must follow suit or play trump if possible');
         return false;
       }
       
       // Handle special case: If player is declarer and unable to follow suit
       // and plays a card of the trump suit, trump is revealed
       const isFirstCardInTrick = currentTrick.cards.length === 0;
       const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;
       
       // Check if declarer is revealing trump by playing it
       let isRevealingTrump = false;
       if (
         isDeclarer && 
         !trumpState.trumpRevealed && 
         trumpState.finalTrumpSuit && 
         card.suit === trumpState.finalTrumpSuit &&
         !isFirstCardInTrick && // Not leading a trick with trump
         currentTrick.leadSuit !== card.suit // Not following suit (must be unable to)
       ) {
         isRevealingTrump = true;
       }
       
       set(state => {
         // Remove card from hand
         state.players[currentPlayerIndex].hand.splice(cardIndex, 1);
         state.players[currentPlayerIndex].activeCardCount--;
         
         // If first card in trick, set lead suit
         if (isFirstCardInTrick) {
           state.currentTrick.leadSuit = card.suit;
           state.currentTrick.leaderId = currentPlayer.id;
         }
         
         // Add card to current trick
         state.currentTrick.cards.push(card);
         
         // Handle trump reveal by declarer
         if (isRevealingTrump) {
           state.trumpState.trumpRevealed = true;
           
           // If declarer had the folded trump card, add it back to their hand
           if (state.trumpState.finalTrumpCardId && 
               !state.trumpState.declarerChoseKeep) {
             state.players[currentPlayerIndex].hand.push(state.trumpState.finalTrumpCard);
             state.players[currentPlayerIndex].activeCardCount++;
             state.trumpState.finalTrumpCardId = undefined;
           }
         }
         
         // If trick is complete
         if (state.currentTrick.cards.length === state.players.length) {
           // Determine trick winner
           const winningCardIndex = determineTrickWinner(
             state.currentTrick, 
             state.trumpState
           );
           
           const winnerIndex = (currentPlayerIndex - (state.currentTrick.cards.length - 1) + 
                               winningCardIndex + state.players.length) % state.players.length;
           
           // Add completed trick to winner's tricks
           state.players[winnerIndex].tricksWon.push([...state.currentTrick.cards]);
           
           // Add to completed tricks
           state.completedTricks.push({
             ...state.currentTrick,
             winnerId: state.players[winnerIndex].id
           });
           
           // Start new trick with winner as leader
           state.currentTrick = {
             cards: [],
             leaderId: state.players[winnerIndex].id,
             leadSuit: 'Hearts', // Will be set when first card played
             timestamp: Date.now()
           };
           
           // Set next player to trick winner
           state.currentPlayerIndex = winnerIndex;
           
           // Check if round is complete (8 tricks played)
           if (state.completedTricks.length === 8) {
             // Calculate round results and update scores
             calculateRoundResults(state);
           }
         } else {
           // Move to next player
           state.currentPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
         }
       });
       
       return true;
     },
     ```

   - **Scoring and Round Completion with 3p vs 4p Differences**:
     ```typescript
     // Calculate round results with explicit handling of 3p vs 4p differences
     const calculateRoundResults = (state: GameState) => {
       // Get relevant state
       const { players, trumpState, finalBid, gameMode, roundNumber } = state;
       
       if (!finalBid || !trumpState.finalDeclarerId) return;
       
       // Find the declarer and their partner (if 4p)
       const declarerIndex = players.findIndex(p => p.id === trumpState.finalDeclarerId);
       const isRound1Bid = !state.highestBid2 || state.highestBid2.isPass;
       
       let declarerPoints = 0;
       let opponentPoints = 0;
       
       // Calculate points won by each side based on game mode
       if (gameMode === '3p') {
         // In 3p, declarer is solo against temporary alliance of other two
         declarerPoints = calculatePlayerCardPoints(players[declarerIndex]);
         
         // Sum points for other two players
         for (let i = 0; i < players.length; i++) {
           if (i !== declarerIndex) {
             opponentPoints += calculatePlayerCardPoints(players[i]);
           }
         }
       } else {
         // In 4p, two fixed teams - declarer's team vs opponents
         const declarerTeam = players[declarerIndex].team;
         
         // Sum points for each team
         players.forEach(player => {
           const points = calculatePlayerCardPoints(player);
           
           if (player.team === declarerTeam) {
             declarerPoints += points;
           } else {
             opponentPoints += points;
           }
         });
       }
       
       // Check if contract was made
       const declarerWon = declarerPoints >= finalBid.amount;
       
       // Calculate game points based on the complex set of rules
       let gamePointsChange = 0;
       
       if (isRound1Bid) {
         // Round 1 bid scoring is the same for 3p and 4p
         if (finalBid.isHonors) {
           // Honors bid from Round 1
           gamePointsChange = declarerWon ? 2 : -2;
         } else {
           // Normal bid from Round 1
           gamePointsChange = declarerWon ? 1 : -1;
         }
       } else {
         // Round 2 bid scoring differs by game mode
         if (gameMode === '3p') {
           // 3-player mode Round 2 bid
           gamePointsChange = declarerWon ? 2 : -4; // 4 point penalty for failing in 3p
         } else {
           // 4-player mode Round 2 bid
           gamePointsChange = declarerWon ? 2 : -3; // 3 point penalty for failing in 4p
         }
       }
       
       // Create round score record
       const roundScore: RoundScore = {
         roundNumber,
         declarerPoints,
         opponentPoints,
         contract: finalBid.amount,
         bid1Amount: state.highestBid1?.amount,
         bid2Amount: state.highestBid2?.amount,
         isHonors: finalBid.isHonors,
         declarerWon,
         gamePointsChange,
         stakesChange: state.stakesChange,
         timestamp: Date.now()
       };
       
       // Update round scores array
       state.roundScores.push(roundScore);
       
       // Update game scores based on game mode
       updateGameScores(state, declarerIndex, declarerWon, gamePointsChange);
       
       // Check if game is over based on target score
       const isGameOver = checkGameOver(state);
       
       // Update game phase
       state.currentPhase = isGameOver ? 'game_over' : 'round_over';
     };
     
     // Helper to calculate points from a player's won tricks
     const calculatePlayerCardPoints = (player: Player): number => {
       return player.tricksWon
         .flat()
         .reduce((sum, card) => sum + card.pointValue, 0);
     };
     
     // Update game scores based on game mode
     const updateGameScores = (
       state: GameState, 
       declarerIndex: number, 
       declarerWon: boolean, 
       gamePointsChange: number
     ) => {
       const absPoints = Math.abs(gamePointsChange);
       
       if (state.gameMode === '3p') {
         // 3-player scoring
         const playerKeys: Array<keyof GameScore> = ['player1Points', 'player2Points', 'player3Points'];
         
         if (declarerWon) {
           // Declarer wins points
           state.gameScores[playerKeys[declarerIndex]] += absPoints;
         } else {
           // Other two players split points
           for (let i = 0; i < state.players.length; i++) {
             if (i !== declarerIndex) {
               state.gameScores[playerKeys[i]] += absPoints / 2;
             }
           }
         }
       } else {
         // 4-player team scoring
         const declarerTeam = state.players[declarerIndex].team!;
         const winningTeamKey = declarerTeam === 0 ? 'team1Points' : 'team2Points';
         const losingTeamKey = declarerTeam === 0 ? 'team2Points' : 'team1Points';
         
         if (declarerWon) {
           state.gameScores[winningTeamKey] = (state.gameScores[winningTeamKey] || 0) + absPoints;
         } else {
           state.gameScores[losingTeamKey] = (state.gameScores[losingTeamKey] || 0) + absPoints;
         }
       }
     };
     
     // Helper to check if game is over
     const checkGameOver = (state: GameState): boolean => {
       const { gameScores, gameMode, targetScore } = state;
       
       if (gameMode === '3p') {
         // Check if any player reached target
         return (
           gameScores.player1Points >= targetScore ||
           gameScores.player2Points >= targetScore ||
           gameScores.player3Points >= targetScore
         );
       } else {
         // Check if any team reached target
         return (
           (gameScores.team1Points || 0) >= targetScore ||
           (gameScores.team2Points || 0) >= targetScore
         );
       }
     };
     ```

3. **Edge Case Handling for Bidding**
   ```typescript
   // Helper to check if bidding round is complete and handle transition
   const checkBiddingCompletion = (state: GameState) => {
     const { currentPhase, bids1, bids2, highestBid1, players } = state;
     
     if (currentPhase === 'bidding1_start') {
       // Handle edge case: if all players pass in first round
       const allPassed = bids1.length >= players.length &&
         bids1.slice(-players.length).every(bid => bid.isPass);
       
       // If all players passed in Round 1, handle this edge case
       if (allPassed && !highestBid1) {
         // In real game, typically would reshuffle and restart
         // Here we just reset bidding and let players try again
         state.bids1 = [];
         state.currentPlayerIndex = state.originalBidderIndex;
         console.log('All players passed in Round 1, restarting bidding');
         return;
       }
       
       // If everyone except the highest bidder has passed
       const passedPlayers = bids1.filter(bid => bid.isPass).length;
       if (passedPlayers === players.length - 1 && highestBid1) {
         // Find the highest bidder's index
         const highestBidderIndex = players.findIndex(p => p.id === highestBid1.playerId);
         state.currentPlayerIndex = highestBidderIndex;
         state.currentPhase = 'trump_selection_provisional';
       }
     } else if (currentPhase === 'bidding2_start') {
       // Similar logic for Round 2
       const allPassed = bids2.length >= players.length &&
         bids2.slice(-players.length).every(bid => bid.isPass);
       
       // If everyone passed in Round 2, the highest bidder from Round 1 is the final declarer
       if (allPassed && highestBid1) {
         state.finalBid = highestBid1;
         // Find the highest Round 1 bidder's index
         const highestBidderIndex = players.findIndex(p => p.id === highestBid1.playerId);
         state.currentPlayerIndex = highestBidderIndex;
         state.currentPhase = 'trump_selection_final';
         return;
       }
       
       // If there's a valid bid and everyone else passed
       const passedPlayers = bids2.filter(bid => bid.isPass).length;
       if (passedPlayers === players.length - 1 && state.highestBid2) {
         state.finalBid = state.highestBid2;
         // Find the highest Round 2 bidder's index
         const highestBidderIndex = players.findIndex(p => p.id === state.highestBid2.playerId);
         state.currentPlayerIndex = highestBidderIndex;
         state.currentPhase = 'trump_selection_final';
       }
     }
   };
   ```

### Step 4: Basic UI Components

1. **Card Component**
   - Create a reusable card component with dynamic rendering:
   ```typescript
   // src/components/game/Card.tsx
   import { useState } from 'react';
   import { motion } from 'framer-motion';
   import { Card as CardType } from '../../models/card';
   
   interface CardProps {
     card: CardType;
     isSelectable: boolean;
     isSelected?: boolean;
     isPlayable?: boolean;
     onClick?: () => void;
     style?: React.CSSProperties;
     faceDown?: boolean;
   }
   
   export const Card: React.FC<CardProps> = ({
     card,
     isSelectable,
     isSelected,
     isPlayable = true,
     onClick,
     style,
     faceDown = false,
   }) => {
     // State for hover effect
     const [isHovered, setIsHovered] = useState(false);
     
     // Determine card suit color
     const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
     
     // Combine styles
     const combinedStyle = {
       ...style,
       opacity: isPlayable ? 1 : 0.5,
       transform: isSelected ? 'translateY(-20px)' : 'none',
       cursor: isSelectable ? 'pointer' : 'default',
     };
     
     return (
       <motion.div
         className={`relative card-container ${isRed ? 'text-red-600' : 'text-black'}`}
         style={combinedStyle}
         whileHover={isSelectable ? { y: -10 } : {}}
         onHoverStart={() => setIsHovered(true)}
         onHoverEnd={() => setIsHovered(false)}
         onClick={isSelectable ? onClick : undefined}
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         exit={{ scale: 0.8, opacity: 0 }}
         transition={{ duration: 0.2 }}
       >
         <div 
           className={`
             card relative w-24 h-36 rounded-lg shadow-md
             ${isSelectable && isHovered ? 'ring-2 ring-blue-400' : ''}
             ${isSelected ? 'ring-2 ring-blue-600' : ''}
           `}
         >
           {faceDown ? (
             // Card back
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
               <div className="w-16 h-24 rounded-md bg-blue-200 bg-opacity-20 flex items-center justify-center">
                 <span className="text-white text-opacity-70 text-3xl">28</span>
               </div>
             </div>
           ) : (
             // Card front
             <div className="absolute inset-0 bg-white rounded-lg p-2 flex flex-col">
               {/* Top left rank and suit */}
               <div className="text-left">
                 <div className="text-lg font-bold">{card.rank}</div>
                 <div className="text-xl">
                   {card.suit === 'Hearts' && '♥'}
                   {card.suit === 'Diamonds' && '♦'}
                   {card.suit === 'Clubs' && '♣'}
                   {card.suit === 'Spades' && '♠'}
                 </div>
               </div>
               
               {/* Center large suit */}
               <div className="flex-grow flex items-center justify-center text-4xl">
                 {card.suit === 'Hearts' && '♥'}
                 {card.suit === 'Diamonds' && '♦'}
                 {card.suit === 'Clubs' && '♣'}
                 {card.suit === 'Spades' && '♠'}
               </div>
               
               {/* Bottom right rank and suit (inverted) */}
               <div className="text-right -rotate-180">
                 <div className="text-lg font-bold">{card.rank}</div>
                 <div className="text-xl">
                   {card.suit === 'Hearts' && '♥'}
                   {card.suit === 'Diamonds' && '♦'}
                   {card.suit === 'Clubs' && '♣'}
                   {card.suit === 'Spades' && '♠'}
                 </div>
               </div>
             </div>
           )}
         </div>
         
         {/* Point value indicator */}
         {!faceDown && card.pointValue > 0 && (
           <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
             {card.pointValue}
           </div>
         )}
       </motion.div>
     );
   };
   ```

2. **Player Area Component**
   - Display player information
   - Show hand of cards
   - Indicate current player's turn

3. **Game Table Component**
   - Layout for the game board
   - Positioning of players around the table
   - Display area for current trick
   - Display area for folded trump card

4. **Bidding Interface**
   - Bid input controls
   - Display current highest bid
   - Pass button

5. **Trump Selection Interface**
   - Card selection for folding
   - Confirmation controls

### Step 5: Local Multiplayer Implementation

1. **Game Setup Screen**
   - Implement a setup screen to configure local game:
   ```typescript
   // src/pages/GameSetup.tsx
   import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { motion } from 'framer-motion';
   import { useGameStore } from '../store/gameStore';
   
   export const GameSetup: React.FC = () => {
     const navigate = useNavigate();
     const initializeGame = useGameStore(state => state.initializeGame);
     
     // Local state for setup options
     const [gameMode, setGameMode] = useState<'3p' | '4p'>('4p');
     const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
     const [targetScore, setTargetScore] = useState<number>(8);
     
     // Update player name
     const updatePlayerName = (index: number, name: string) => {
       const newNames = [...playerNames];
       newNames[index] = name;
       setPlayerNames(newNames);
     };
     
     // Handle game start
     const handleStartGame = () => {
       // Trim player array to correct length based on game mode
       const playerCount = gameMode === '3p' ? 3 : 4;
       const gamePlayers = playerNames.slice(0, playerCount).map(name => 
         name.trim() || `Player ${playerNames.indexOf(name) + 1}`
       );
       
       // Initialize the game in the store
       initializeGame(gamePlayers, gameMode);
       
       // Update target score
       useGameStore.setState(state => {
         state.targetScore = targetScore;
       });
       
       // Navigate to the gameplay screen
       navigate('/play');
     };
     
     return (
       <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 flex flex-col items-center justify-center">
         <motion.div 
           className="bg-white text-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
         >
           <h1 className="text-2xl font-bold text-center mb-6">28 Card Game Setup</h1>
           
           {/* Game Mode Selection */}
           <div className="mb-6">
             <label className="block text-sm font-medium mb-2">Game Mode</label>
             <div className="flex gap-4">
               <button
                 onClick={() => setGameMode('3p')}
                 className={`flex-1 py-2 px-4 rounded-md ${
                   gameMode === '3p' 
                     ? 'bg-blue-600 text-white' 
                     : 'bg-gray-200 text-gray-800'
                 }`}
               >
                 3 Players
               </button>
               <button
                 onClick={() => setGameMode('4p')}
                 className={`flex-1 py-2 px-4 rounded-md ${
                   gameMode === '4p' 
                     ? 'bg-blue-600 text-white' 
                     : 'bg-gray-200 text-gray-800'
                 }`}
               >
                 4 Players
               </button>
             </div>
           </div>
           
           {/* Player Names */}
           <div className="mb-6">
             <label className="block text-sm font-medium mb-2">Player Names</label>
             <div className="space-y-3">
               {playerNames.slice(0, gameMode === '3p' ? 3 : 4).map((name, index) => (
                 <div key={index} className="flex items-center">
                   <span className="w-20 text-sm text-gray-600">
                     {index === 0 ? '(Dealer)' : index === 1 ? '(First Bidder)' : ''}
                   </span>
                   <input
                     type="text"
                     value={name}
                     onChange={(e) => updatePlayerName(index, e.target.value)}
                     placeholder={`Player ${index + 1}`}
                     className="flex-grow p-2 border rounded"
                   />
                 </div>
               ))}
             </div>
           </div>
           
           {/* Target Score */}
           <div className="mb-6">
             <label className="block text-sm font-medium mb-2">Target Score to Win</label>
             <select
               value={targetScore}
               onChange={(e) => setTargetScore(Number(e.target.value))}
               className="w-full p-2 border rounded"
             >
               <option value={6}>6 Points</option>
               <option value={8}>8 Points</option>
               <option value={10}>10 Points</option>
               <option value={12}>12 Points</option>
             </select>
           </div>
           
           {/* Start Game Button */}
           <button
             onClick={handleStartGame}
             className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium"
           >
             Start Game
           </button>
         </motion.div>
       </div>
     );
   };
   ```

2. **Turn-Based Play Mechanism**
   - Implement "hot seat" style play where the device is passed between players
   - Add a "Ready for next player" transition screen to prevent seeing other players' hands
   - **Transition Screen:** Implement a modal or full-screen overlay shown after a player completes their turn (play card, bid, etc.). This screen should:
     - Display a message like "Turn Complete. Ready for [Next Player Name]?"
     - Require an explicit action (e.g., a button click "Start Turn") before revealing the next player's hand and enabling their controls.
     - This ensures the device can be passed without revealing sensitive information.
   - Hide/show hands based on current player

3. **Game State Persistence**
   - **Local Storage:** Use `localStorage.setItem('savedGameState', JSON.stringify(gameState))` to save the current `GameState` object.
   - **Loading:** On application load, check `localStorage.getItem('savedGameState')`. If present, parse it (`JSON.parse`) and prompt the user if they want to resume the saved game.
   - **Size Consideration:** Note that `localStorage` has limits (typically 5-10MB). While unlikely for a single game state, monitor the size of the stringified state during development. If it approaches limits, consider more selective saving (though full state is simpler for resuming).
   - **Clearing:** Provide an option to clear the saved game state (e.g., when starting a new game or explicitly abandoning).
   - **Game History:** Round scores (`roundScores` array within `GameState`) provide basic history. For more detailed turn-by-turn history locally, a separate log array could be added to the state, but be mindful of `localStorage` size implications.

### Step 6: Game UI Refinement

1. **Animations and Visual Feedback**
   - Card dealing animations
   - Card playing animations
   - Trick collection animations
   - Turn indicators

2. **Game Information Display**
   - Current phase indicator
   - Bidding history
   - Score display
   - Trump suit indicator (when revealed)

3. **Responsive Design**
   - Ensure playability on different screen sizes
   - Optimize layout for mobile devices in landscape orientation

### Step 7: Testing and Refinement

1. **Manual Testing:** Robust handling for Cloud Function errors (user-friendly messages), Firestore connectivity issues.
2. **Visual Feedback:** Consistent loading indicators, smooth animations (dealing, playing, collecting tricks), clear cues for active elements, turns, game state.
3. **Responsiveness:** Use responsive design principles (e.g., Tailwind CSS) for usability on various screen sizes, including good support for mobile landscape mode.

### Step 8: Comprehensive Testing Strategy

A robust testing approach is essential for a complex card game like 28, where many rule edge cases and multiplayer scenarios need to be validated.

1. **Unit Testing**

   **Setup:**
   - Use Jest as the primary test runner
   - Use React Testing Library for component testing
   - Create a dedicated `/tests` directory with a structure mirroring the source code

   **Core Game Logic Tests:**
   - Create a comprehensive test suite for the game engine covering:
     - Deck generation and card utilities
     - Bidding rules validation (minimum bids, honors thresholds)
     - Trump selection and folding mechanics
     - Card playing rules (following suit, trump playing)
     - Trick winning determination
     - Score calculation (3p vs 4p differences)
     - Game progression state transitions

   **Example Test Scenarios:**
   ```typescript
   // Example test for bidding validation
   describe('Bidding Validation', () => {
     test('should reject bids below 14', () => {
       expect(isValidBid(13, 'bidding1', '4p')).toBe(false);
     });

     test('should accept bids between 14 and 28', () => {
       expect(isValidBid(14, 'bidding1', '4p')).toBe(true);
       expect(isValidBid(28, 'bidding1', '4p')).toBe(true);
     });

     test('should reject bids above 28', () => {
       expect(isValidBid(29, 'bidding1', '4p')).toBe(false);
     });

     test('should enforce minimum bid in round 2 for 4p', () => {
       expect(isValidBid(23, 'bidding2', '4p')).toBe(false);
       expect(isValidBid(24, 'bidding2', '4p')).toBe(true);
     });

     test('should enforce minimum bid in round 2 for 3p', () => {
       expect(isValidBid(21, 'bidding2', '3p')).toBe(false);
       expect(isValidBid(22, 'bidding2', '3p')).toBe(true);
     });

     test('should detect honors bids correctly in 3p', () => {
       expect(isHonorsBid(18, '3p', 'bidding1')).toBe(false);
       expect(isHonorsBid(19, '3p', 'bidding1')).toBe(true);
     });

     test('should detect honors bids correctly in 4p', () => {
       expect(isHonorsBid(20, '4p', 'bidding1')).toBe(false);
       expect(isHonorsBid(21, '4p', 'bidding1')).toBe(true);
     });
   });

   // Example test for trick winning logic
   describe('Trick Winning Logic', () => {
     test('highest card of led suit should win when no trump played', () => {
       const trick: Trick = {
         cards: [
           { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
           { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
           { id: 'H10', suit: 'Hearts', rank: '10', pointValue: 1, order: 5 }
         ],
         leaderId: 'player1',
         leadSuit: 'Hearts',
         timestamp: Date.now()
       };
       
       expect(determineTrickWinner(trick)).toBe(1); // Index of HJ
     });

     test('trump card should win over non-trump cards', () => {
       const trick: Trick = {
         cards: [
           { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
           { id: 'S7', suit: 'Spades', rank: '7', pointValue: 0, order: 1 },
           { id: 'H10', suit: 'Hearts', rank: '10', pointValue: 1, order: 5 }
         ],
         leaderId: 'player1',
         leadSuit: 'Hearts',
         timestamp: Date.now()
       };
       
       expect(determineTrickWinner(trick, 'Spades', true)).toBe(1); // Index of S7
     });

     test('highest trump card should win when multiple trumps played', () => {
       const trick: Trick = {
         cards: [
           { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
           { id: 'S7', suit: 'Spades', rank: '7', pointValue: 0, order: 1 },
           { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 }
         ],
         leaderId: 'player1',
         leadSuit: 'Hearts',
         timestamp: Date.now()
       };
       
       expect(determineTrickWinner(trick, 'Spades', true)).toBe(2); // Index of SJ
     });
   });
   ```

   **Component Tests:**
   - Test UI components for correct rendering and interaction:
     - Card component (visual states, selection)
     - Player area component
     - Bidding interface
     - Trump selection interface

2. **Integration Testing**

   **Game Flow Tests:**
   - Create tests that simulate complete game scenarios:
     - Full bidding rounds
     - Trump selection process
     - Complete trick-taking sequences
     - Round completion and scoring
     - Game completion and winner determination

   **Example Integration Test:**
   ```typescript
   test('complete bidding round flow', async () => {
     // Set up initial game state
     const gameEngine = new GameEngine('4p');
     const initialState = gameEngine.initializeGame(['P1', 'P2', 'P3', 'P4']);
     
     // First player bids
     let result = gameEngine.placeBid('player1', 14);
     expect(result).toBe(true);
     expect(gameEngine.state.bids1.length).toBe(1);
     expect(gameEngine.state.currentPlayerIndex).toBe(1);
     
     // Second player passes
     result = gameEngine.placeBid('player2', 0);
     expect(result).toBe(true);
     expect(gameEngine.state.bids1.length).toBe(2);
     expect(gameEngine.state.currentPlayerIndex).toBe(2);
     
     // Third player bids higher
     result = gameEngine.placeBid('player3', 16);
     expect(result).toBe(true);
     expect(gameEngine.state.bids1.length).toBe(3);
     expect(gameEngine.state.highestBid1.amount).toBe(16);
     
     // Fourth player passes
     result = gameEngine.placeBid('player4', 0);
     expect(result).toBe(true);
     expect(gameEngine.state.bids1.length).toBe(4);
     
     // First player bids honors
     result = gameEngine.placeBid('player1', 21); // Honors in 4p mode
     expect(result).toBe(true);
     expect(gameEngine.state.highestBid1.isHonors).toBe(true);
     
     // Third player passes
     result = gameEngine.placeBid('player3', 0);
     expect(result).toBe(true);
     
     // Check transition to trump selection phase
     expect(gameEngine.state.currentPhase).toBe('trump_selection_provisional');
     expect(gameEngine.state.currentPlayerIndex).toBe(0); // P1 won bidding
   });
   ```

   **Firebase Integration Tests (Phase 2):**
   - Create integration tests for Firebase services:
     - Authentication flows
     - Game creation and joining
     - Real-time updates and synchronization
     - Security rule validation

3. **End-to-End Testing**

   **Setup:**
   - Use Cypress for end-to-end testing
   - Create test scenarios that cover complete user journeys

   **Key Test Scenarios:**
   - Local multiplayer gameplay
   - User registration and login (Phase 2)
   - Game creation and joining flow (Phase 2)
   - Complete game playthrough (local and online)
   - Disconnection and reconnection handling (Phase 2)

   **Example Cypress Test (Phase 2):**
   ```javascript
   describe('Game Creation and Joining', () => {
     beforeEach(() => {
       cy.visit('/');
       cy.login('testuser@example.com', 'password123');
     });
     
     it('should allow creating a new game', () => {
       cy.get('[data-cy=create-game-button]').click();
       cy.get('[data-cy=game-mode-4p]').click();
       cy.get('[data-cy=create-game-submit]').click();
       
       // Should navigate to waiting room
       cy.url().should('include', '/game/');
       cy.get('[data-cy=waiting-room]').should('be.visible');
       cy.get('[data-cy=player-list]').should('contain', 'testuser');
     });
     
     it('should allow joining an existing game', () => {
       // Setup: Create a game with another user first
       cy.setupTestGame();
       
       cy.get('[data-cy=game-list-item]').first().click();
       cy.get('[data-cy=join-game-button]').click();
       
       // Should navigate to waiting room
       cy.url().should('include', '/game/');
       cy.get('[data-cy=waiting-room]').should('be.visible');
       cy.get('[data-cy=player-list]').should('contain', 'testuser');
     });
   });
   ```

4. **Mobile and Responsive Testing**

   **Device Testing Matrix:**
   - iOS Devices:
     - iPhone SE (small)
     - iPhone 11/12/13 (medium)
     - iPhone Pro Max models (large)
     - iPad Mini
     - iPad Pro
   - Android Devices:
     - Small Android phone (5" or smaller)
     - Medium Android phone (5-6")
     - Large Android phone (6"+ phablet)
     - Android tablet

   **Responsive Testing Checklist:**
   - Verify all UI elements are appropriately sized for touch
   - Ensure text is readable on all device sizes
   - Check that gestures work correctly (swipe, tap, etc.)
   - Verify orientation changes work smoothly
   - Test with various network conditions (fast, slow, offline)

5. **Performance Testing**

   **Client Performance:**
   - Test UI rendering performance with React DevTools
   - Measure and optimize bundle size
   - Test memory usage during long gameplay sessions

   **Firebase Performance (Phase 2):**
   - Test read/write operations under load
   - Measure and optimize query performance
   - Test with simulated network conditions (latency, bandwidth limits)

6. **Accessibility Testing**

   **Automated Tests:**
   - Use tools like axe-core for automated accessibility testing
   - Verify proper HTML semantics and ARIA attributes
   - Check color contrast ratios

   **Manual Testing:**
   - Test keyboard navigation for all interactions
   - Test with screen readers
   - Verify proper focus management
   - Test with high contrast mode

7. **Test Coverage Goals**

   - Unit tests: >80% coverage of game logic code
   - Component tests: >70% coverage of UI components
   - Integration tests: Cover all critical user flows
   - All edge cases in game rules explicitly tested
   - All responsive breakpoints verified

8. **Testing Tools**

   - **Jest**: Primary test runner and assertion library
   - **React Testing Library**: Component testing
   - **Cypress**: End-to-end testing
   - **Firebase Emulator Suite**: Local Firebase testing (Phase 2)
   - **Lighthouse**: Performance and accessibility testing
   - **axe-core**: Automated accessibility testing
   - **React DevTools**: Component performance testing

### Step 9: Accessibility and Responsive Design

#### Responsive Design Approach

**Tailwind Breakpoints:**
- Implement a mobile-first design approach using Tailwind CSS breakpoints:
  - `sm`: 640px (small mobile devices)
  - `md`: 768px (tablets and larger phones)
  - `lg`: 1024px (laptops and desktop)
  - `xl`: 1280px (large desktop screens)
  - `2xl`: 1536px (extra large screens)

**Handling Card Game UI Challenges:**
- Cards need to be large enough to be readable but must fit the available screen space
- Player hands need to adjust based on device size
- Game table layout needs to adapt to different aspect ratios

#### Mobile-Specific UI Adaptations

**Card Component:**
```typescript
// Responsive card component with different sizes based on screen
export const Card: React.FC<CardProps> = ({ 
  card, 
  isSelectable,
  isSelected,
  onClick,
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'w-14 h-20 text-xs', // Small cards for mobile portrait
    md: 'w-20 h-28 text-sm', // Medium cards for mobile landscape/tablet
    lg: 'w-24 h-36 text-base' // Large cards for desktop
  };
  
  return (
    <div 
      className={`card relative ${sizeClasses[size]} rounded shadow-md
        ${isSelected ? 'transform -translate-y-4' : ''}
        ${isSelectable ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}
      `}
      onClick={isSelectable ? onClick : undefined}
    >
      {/* Card content */}
    </div>
  );
};
```

**Hand Layout:**
```typescript
// Responsive hand component with different layouts
export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  playableCards
}) => {
  return (
    <div className="relative">
      {/* Different overlapping strategies based on screen size */}
      <div className="
        flex items-center justify-center
        sm:space-x-0 md:space-x-1 lg:space-x-2
        sm:ml-0 md:ml-4 lg:ml-6
      ">
        {/* For small screens, cards overlap more */}
        <div className="hidden sm:block md:hidden">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className="absolute"
              style={{ left: `${index * 20}px` }} // More overlap
            >
              <Card
                card={card}
                size="sm"
                isSelectable={playableCards?.includes(card.id)}
                onClick={() => onCardClick(card)}
              />
            </div>
          ))}
        </div>
        
        {/* For medium screens, cards overlap less */}
        <div className="hidden md:block lg:hidden">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className="absolute"
              style={{ left: `${index * 30}px` }} // Less overlap
            >
              <Card
                card={card}
                size="md"
                isSelectable={playableCards?.includes(card.id)}
                onClick={() => onCardClick(card)}
              />
            </div>
          ))}
        </div>
        
        {/* For large screens, minimal card overlap */}
        <div className="hidden lg:block">
          {cards.map((card, index) => (
            <div 
              key={card.id}
              className="absolute"
              style={{ left: `${index * 40}px` }} // Minimal overlap
            >
              <Card
                card={card}
                size="lg"
                isSelectable={playableCards?.includes(card.id)}
                onClick={() => onCardClick(card)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Game Table Layout:**
```typescript
// Responsive game table layout
export const GameTable: React.FC<GameTableProps> = ({
  players,
  currentTrick,
  currentPlayerIndex,
  trumpSuit,
  trumpRevealed
}) => {
  return (
    <div className="game-table relative w-full h-full bg-green-700 rounded-full">
      {/* Center area for current trick - adaptive sizing */}
      <div className="
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-48 lg:h-48
        bg-green-800 rounded-full flex items-center justify-center
      ">
        {/* Current trick cards */}
      </div>
      
      {/* Player positions - adaptive for different player counts and screen sizes */}
      <div className="player-positions absolute inset-0">
        {/* Bottom player (user) */}
        <div className="
          absolute bottom-0 left-1/2 transform -translate-x-1/2
          sm:mb-2 md:mb-4 lg:mb-8
        ">
          <PlayerPosition 
            player={players[0]}
            isActive={currentPlayerIndex === 0}
            orientation="bottom"
          />
        </div>
        
        {/* Left player */}
        <div className="
          absolute top-1/2 left-0 transform -translate-y-1/2
          sm:ml-2 md:ml-4 lg:ml-8
        ">
          <PlayerPosition 
            player={players[1]}
            isActive={currentPlayerIndex === 1}
            orientation="left"
          />
        </div>
        
        {/* Top player */}
        <div className="
          absolute top-0 left-1/2 transform -translate-x-1/2
          sm:mt-2 md:mt-4 lg:mt-8
        ">
          <PlayerPosition 
            player={players[2]}
            isActive={currentPlayerIndex === 2}
            orientation="top"
          />
        </div>
        
        {/* Right player (only in 4p mode) */}
        {players.length > 3 && (
          <div className="
            absolute top-1/2 right-0 transform -translate-y-1/2
            sm:mr-2 md:mr-4 lg:mr-8
          ">
            <PlayerPosition 
              player={players[3]}
              isActive={currentPlayerIndex === 3}
              orientation="right"
            />
          </div>
        )}
      </div>
      
      {/* Trump indicator - adaptive positioning */}
      {trumpRevealed && trumpSuit && (
        <div className="
          absolute
          sm:top-2 sm:right-2 md:top-4 md:right-4 lg:top-8 lg:right-8
          sm:text-xl md:text-2xl lg:text-3xl
          font-bold text-white
        ">
          {trumpSuit === 'Hearts' && '♥'}
          {trumpSuit === 'Diamonds' && '♦'}
          {trumpSuit === 'Clubs' && '♣'}
          {trumpSuit === 'Spades' && '♠'}
        </div>
      )}
    </div>
  );
};
```

#### Orientation Handling

**Orientation Detection:**
```typescript
// Hook to detect and respond to orientation changes
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  
  useEffect(() => {
    const handleResize = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return orientation;
};
```

**Orientation-Specific Layouts:**
```typescript
// Component that adapts based on orientation
export const GameLayout: React.FC = () => {
  const orientation = useOrientation();
  
  if (orientation === 'portrait') {
    return (
      <div className="flex flex-col h-screen">
        <div className="h-2/3">
          <GameTable />
        </div>
        <div className="h-1/3">
          <PlayerHand />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <div className="w-3/4">
        <GameTable />
      </div>
      <div className="w-1/4">
        <PlayerHand />
      </div>
    </div>
  );
};
```

#### Accessibility Implementation

**Keyboard Navigation:**
```typescript
// Enhanced card component with keyboard support
export const AccessibleCard: React.FC<CardProps> = ({
  card,
  isSelectable,
  isSelected,
  onClick,
  tabIndex
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick && onClick();
    }
  };
  
  return (
    <div
      role="button"
      tabIndex={isSelectable ? (tabIndex || 0) : -1}
      aria-pressed={isSelected}
      aria-label={`${card.rank} of ${card.suit}${card.pointValue > 0 ? `, ${card.pointValue} points` : ''}`}
      className={`card-component ${isSelectable ? 'cursor-pointer' : ''}`}
      onClick={isSelectable ? onClick : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Card content */}
    </div>
  );
};
```

**Screen Reader Support:**
```typescript
// Game status announcer for screen readers
export const GameStatusAnnouncer: React.FC<GameStatusAnnouncerProps> = ({
  phase,
  currentPlayerName,
  highestBid,
  trumpRevealed,
  trumpSuit
}) => {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    let message = '';
    
    switch (phase) {
      case 'bidding1':
        message = `First bidding round. ${currentPlayerName}'s turn to bid. Current highest bid: ${highestBid || 'None'}`;
        break;
      case 'bidding2':
        message = `Second bidding round. ${currentPlayerName}'s turn to bid. Current highest bid: ${highestBid || 'None'}`;
        break;
      case 'playing':
        message = `${currentPlayerName}'s turn to play a card.`;
        if (trumpRevealed && trumpSuit) {
          message += ` Trump suit is ${trumpSuit}.`;
        }
        break;
      // Other phases...
    }
    
    setAnnouncement(message);
  }, [phase, currentPlayerName, highestBid, trumpRevealed, trumpSuit]);
  
  return (
    <div 
      role="status"
      aria-live="polite"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};
```

### Step 10: Project Timeline and Milestones

This project will be implemented in two distinct phases, with clear milestones and decision points to ensure quality and progress tracking.

#### Phase 1: Core Game Logic and Local Multiplayer (Estimated: 8 weeks)

**Week 1-2: Project Setup and Core Models**
- **Milestone 1.1:** Project scaffolding and dependencies setup (End of Week 1)
- **Milestone 1.2:** Core game models and types implementation (End of Week 2)

**Week 3-4: Game Logic Implementation**
- **Milestone 1.3:** Basic game mechanics implementation (End of Week 3)
- **Milestone 1.4:** Complete game logic with scoring (End of Week 4)
- **Decision Point 1:** Review game logic implementation

**Week 5-6: UI Components and Basic Gameplay**
- **Milestone 1.5:** Core UI components (End of Week 5)
- **Milestone 1.6:** Complete local gameplay UI (End of Week 6)
- **Decision Point 2:** Gameplay experience review

**Week 7-8: Testing, Refinement, and Mobile Optimization**
- **Milestone 1.7:** Testing and bug fixes (End of Week 7)
- **Milestone 1.8:** Mobile optimization and refinement (End of Week 8)
- **Phase 1 Completion Review**

#### Phase 2: Online Multiplayer with Firebase (Estimated: 10 weeks)

**Week 9-10: Firebase Setup and Authentication**
- **Milestone 2.1:** Firebase project setup (End of Week 9)
- **Milestone 2.2:** Authentication UI and functionality (End of Week 10)
- **Decision Point 3:** Authentication review

**Week 11-12: Game Lobby and Matchmaking**
- **Milestone 2.3:** Lobby implementation (End of Week 11)
- **Milestone 2.4:** Waiting room and matchmaking (End of Week 12)
- **Decision Point 4:** Lobby functionality review

**Week 13-15: Online Game State Synchronization**
- **Milestone 2.5:** Cloud Functions implementation (End of Week 13)
- **Milestone 2.6:** Game state synchronization (End of Week 14)
- **Milestone 2.7:** Gameplay action functions (End of Week 15)
- **Decision Point 5:** Game synchronization review

**Week 16-18: Game Completion and Additional Features**
- **Milestone 2.8:** Round and game completion (End of Week 16)
- **Milestone 2.9:** Disconnection handling and presence (End of Week 17)
- **Milestone 2.10:** Final features and refinement (End of Week 18)
- **Phase 2 Completion Review**

#### Dependencies and Critical Path

**Critical Dependencies:**
1. Game logic implementation must be completed before UI components
2. Local gameplay must be functional before online implementation
3. Firebase authentication must be working before lobby implementation
4. Game state synchronization must be reliable before implementing game actions
5. Basic gameplay actions must work before implementing edge cases and refinements

**Risk Mitigation:**
1. **Game Logic Complexity:** Begin with simplified state diagrams and validate rules with experienced players before implementation
2. **Firebase Costs:** Use the free tier efficiently and implement quota monitors
3. **Multiplayer Sync Issues:** Implement comprehensive logging and state validation
4. **Mobile Device Compatibility:** Test early and often on a variety of devices

## Phase 2: Online Multiplayer with Firebase

In this phase, we'll integrate Firebase services to enable online multiplayer functionality, user authentication, and persistent game data.

### Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project with a name like "28-card-game"
   - Configure Google Analytics if desired
   - Once created, register a web app in the project overview

2. **Configure Firebase Services**
   - **Authentication**: 
     - Enable Email/Password authentication
     - Optionally enable Google authentication
     - Configure authentication emails and templates

   - **Firestore Database**:
     - Create a Firestore database
     - Start in production mode with appropriate regional settings
     - Set up initial security rules:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         // Base public profile info can be read by any authenticated user
         match /users/{userId} {
           allow read: if request.auth != null;
           allow write: if request.auth != null && request.auth.uid == userId;
         }
         
         // Game metadata can be read by anyone, but only modified through functions
         match /games/{gameId} {
           allow read: if request.auth != null;
           allow create: if request.auth != null;
           allow update: if false; // Only Cloud Functions can update
         }
         
         // Player hands are only visible to the player
         match /playerHands/{gameId}/hands/{playerId} {
           allow read: if request.auth != null && request.auth.uid == playerId;
           allow write: if false; // Only Cloud Functions can write
         }
       }
     }
     ```

   - **Cloud Functions**:
     - Enable Cloud Functions for Firebase
     - Set up Node.js environment for Cloud Functions:
       ```bash
       npm install -g firebase-tools
       firebase login
       firebase init functions
       # Select TypeScript, ESLint
       ```

   - **Firebase Hosting**:
     - Enable Firebase Hosting
     - Configure hosting setup:
       ```bash
       firebase init hosting
       # Select public directory (e.g., dist)
       # Configure SPA routing
       ```

3. **Install Firebase Dependencies**
   - Add Firebase SDK and related packages to the project:
   ```bash
   yarn add firebase
   yarn add firebase-admin firebase-functions # For Cloud Functions directory
   ```

   - Set up Firebase configuration:
   ```typescript
   // src/services/firebase/config.ts
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID,
     measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
   };

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const firestore = getFirestore(app);
   
   export default app;
   ```

   - Create a .env file for Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. **Create Firebase Service Layer**
   - Implement service classes for Firebase interactions:
   
   ```typescript
   // src/services/firebase/authService.ts
   import { 
     createUserWithEmailAndPassword, 
     signInWithEmailAndPassword,
     signOut as firebaseSignOut,
     onAuthStateChanged,
     User
   } from 'firebase/auth';
   import { doc, setDoc, getDoc } from 'firebase/firestore';
   import { auth, firestore } from './config';
   
   // Register a new user
   export const registerUser = async (
     email: string, 
     password: string, 
     displayName: string
   ): Promise<User> => {
     try {
       // Create auth user
       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
       const user = userCredential.user;
       
       // Create user profile in Firestore
       await setDoc(doc(firestore, 'users', user.uid), {
         uid: user.uid,
         email,
         displayName,
         createdAt: new Date().toISOString(),
         gamesPlayed: 0,
         gamesWon: 0,
       });
       
       return user;
     } catch (error) {
       console.error('Error registering user:', error);
       throw error;
     }
   };
   
   // Sign in existing user
   export const signIn = async (
     email: string, 
     password: string
   ): Promise<User> => {
     try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     } catch (error) {
       console.error('Error signing in:', error);
       throw error;
     }
   };
   
   // Sign out
   export const signOut = async (): Promise<void> => {
     try {
       await firebaseSignOut(auth);
     } catch (error) {
       console.error('Error signing out:', error);
       throw error;
     }
   };
   
   // Get user profile data
   export const getUserProfile = async (userId: string) => {
     try {
       const docRef = doc(firestore, 'users', userId);
       const docSnap = await getDoc(docRef);
       
       if (docSnap.exists()) {
         return docSnap.data();
       } else {
         console.error('No user profile found');
         return null;
       }
     } catch (error) {
       console.error('Error getting user profile:', error);
       throw error;
     }
   };
   
   // Subscribe to auth state changes
   export const subscribeToAuthChanges = (
     callback: (user: User | null) => void
   ) => {
     return onAuthStateChanged(auth, callback);
   };
   ```
   
   - Create adapters to convert between local models and Firebase data structures:
   
   ```typescript
   // src/services/firebase/gameService.ts
   import { 
     collection, 
     doc, 
     addDoc, 
     getDoc, 
     getDocs, 
     query, 
     where,
     onSnapshot,
     Unsubscribe
   } from 'firebase/firestore';
   import { httpsCallable } from 'firebase/functions';
   import { firestore, functions } from './config';
   import type { GameState, Bid, Card, Player } from '../../models';
   
   // Fetch available games
   export const getAvailableGames = async () => {
     try {
       const gamesQuery = query(
         collection(firestore, 'games'),
         where('status', '==', 'waiting')
       );
       
       const querySnapshot = await getDocs(gamesQuery);
       const games: any[] = [];
       
       querySnapshot.forEach((doc) => {
         games.push({
           id: doc.id,
           ...doc.data()
         });
       });
       
       return games;
     } catch (error) {
       console.error('Error fetching available games:', error);
       throw error;
     }
   };
   
   // Subscribe to available games
   export const subscribeToAvailableGames = (
     callback: (games: any[]) => void
   ): Unsubscribe => {
     const gamesQuery = query(
       collection(firestore, 'games'),
       where('status', '==', 'waiting')
     );
     
     return onSnapshot(gamesQuery, (querySnapshot) => {
       const games: any[] = [];
       querySnapshot.forEach((doc) => {
         games.push({
           id: doc.id,
           ...doc.data()
         });
       });
       
       callback(games);
     });
   };
   
   // Create a new game
   export const createGame = async (
     hostId: string,
     hostName: string,
     gameMode: '3p' | '4p'
   ) => {
     try {
       const createGameFunction = httpsCallable(functions, 'createGame');
       const result = await createGameFunction({
         gameMode,
         hostName
       });
       
       return result.data;
     } catch (error) {
       console.error('Error creating game:', error);
       throw error;
     }
   };
   
   // Join an existing game
   export const joinGame = async (
     gameId: string,
     playerId: string,
     playerName: string
   ) => {
     try {
       const joinGameFunction = httpsCallable(functions, 'joinGame');
       const result = await joinGameFunction({
         gameId,
         playerName
       });
       
       return result.data;
     } catch (error) {
       console.error('Error joining game:', error);
       throw error;
     }
   };
   
   // Leave a game
   export const leaveGame = async (
     gameId: string
   ) => {
     try {
       const leaveGameFunction = httpsCallable(functions, 'leaveGame');
       const result = await leaveGameFunction({
         gameId
       });
       
       return result.data;
     } catch (error) {
       console.error('Error leaving game:', error);
       throw error;
     }
   };
   
   // Subscribe to a specific game
   export const subscribeToGame = (
     gameId: string,
     callback: (gameData: any) => void
   ): Unsubscribe => {
     const gameRef = doc(firestore, 'games', gameId);
     
     return onSnapshot(gameRef, (docSnapshot) => {
       if (docSnapshot.exists()) {
         callback({
           id: docSnapshot.id,
           ...docSnapshot.data()
         });
       } else {
         console.error('Game does not exist');
       }
     });
   };
   
   // Subscribe to player's hand
   export const subscribeToPlayerHand = (
     gameId: string,
     playerId: string,
     callback: (hand: Card[]) => void
   ): Unsubscribe => {
     const handRef = doc(firestore, 'playerHands', gameId, 'hands', playerId);
     
     return onSnapshot(handRef, (docSnapshot) => {
       if (docSnapshot.exists()) {
         callback(docSnapshot.data().cards);
       } else {
         callback([]);
       }
     });
   };
   
   // Convert Firebase game data to local GameState
   export const firebaseToLocalGame = (
     firebaseGame: any,
     playerHand: Card[] = []
   ): GameState => {
     // Conversion logic here...
     // This would map the Firebase data structure to our local GameState type
     
     return {
       // ...converted data
     } as GameState;
   };
   ```

These setup steps establish the foundation for the Firebase integration, creating the necessary services and adapters to interface between our local game logic and the Firebase backend.

### Step 2: User Authentication

1. **Authentication UI**
   - Create login screen
   - Create registration screen
   - Implement form validation

2. **Authentication Logic**
   - Implement email/password authentication
   - Add Google authentication (optional)
   - Handle authentication state persistence

3. **User Profile Management**
   - Create user profile in Firestore on registration
   - Implement profile update functionality
   - Add avatar selection/upload

### Step 3: Online Game Lobby

1. **Game Lobby UI**
   - Create lobby screen with available games list
   - Add create game button and form
   - Implement join game functionality

2. **Lobby Data Management**
   - Set up Firestore collections for games
   - Implement real-time updates for game listings
   - Create Cloud Functions for game creation and joining

3. **Waiting Room Implementation**
   - Create waiting room UI showing joined players
   - Implement real-time updates for player joins/leaves
   - Add leave game functionality

### Step 4: Online Game State Synchronization

1. **Game State in Firestore**
   - Design Firestore schema for game state
   - Implement security rules to protect game data
   - Create Cloud Functions for game state transitions

2. **Real-time Game Updates**
   - Set up listeners for game state changes
   - Implement UI updates based on real-time data
   - Handle concurrent actions and conflicts

3. **Player Hand Security**
   - Implement secure storage of player hands
   - Ensure players can only see their own cards
   - Create Cloud Functions for card dealing and playing

### Step 5: Game Action Implementation

1. **Bidding Actions**
   - Create Cloud Functions for bid submission and validation
   - Implement client-side bid submission
   - Add real-time updates for bidding state

2. **Trump Selection Actions**
   - Implement secure trump selection and storage
   - Create Cloud Functions for trump reveal requests
   - Add client-side trump selection UI

3. **Card Playing Actions**
   - Create Cloud Functions for card play validation
   - Implement client-side card selection and submission
   - Add real-time updates for trick state

### Step 6: Game Completion and Scoring

1. **Round Completion Logic**
   - Implement server-side round completion detection
   - Create scoring calculation Cloud Functions
   - Add round results display

2. **Game Completion Logic**
   - Implement game completion detection
   - Create game results calculation
   - Add game over screen and return to lobby functionality

3. **Game History and Statistics**
   - Store completed game data
   - Implement player statistics tracking
   - Add game history viewing

### Step 7: Presence and Disconnection Handling

1. **Player Presence System**
   - Implement Firebase presence detection
   - Create UI indicators for player connection status
   - Add reconnection handling

2. **Disconnection Handling**
   - Implement timeout logic for disconnected players
   - Create game state recovery mechanisms
   - Add forfeit/cancellation rules for abandoned games

### Step 8: Testing and Optimization

1. **End-to-End Testing**
   - Test multiplayer functionality with multiple devices
   - Verify real-time updates and synchronization
   - Test disconnection and reconnection scenarios

2. **Performance Optimization**
   - Optimize Firestore queries and data structure
   - Implement caching strategies
   - Reduce unnecessary real-time listeners

3. **Security Audit**
   - Review Firestore security rules
   - Test for potential vulnerabilities
   - Ensure proper authentication and authorization

### Step 9: Deployment and Release Strategy

1. **Environment Setup**
   - Configure development, staging, and production environments:
     ```bash
     # Create different Firebase projects or use single project with multiple sites
     firebase use --add # Add aliases for each environment
     ```
   - Set up environment-specific configuration files:
     ```typescript
     // src/environments/environment.ts (dev)
     // src/environments/environment.staging.ts
     // src/environments/environment.prod.ts
     ```

2. **Continuous Integration/Continuous Deployment**
   - Set up GitHub Actions workflow:
     ```yaml
     # .github/workflows/firebase-deploy.yml
     name: Deploy to Firebase
     
     on:
       push:
         branches: [ main ]
     
     jobs:
       build_and_deploy:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v3
           - uses: actions/setup-node@v3
             with:
               node-version: 16
           - name: Install dependencies
             run: yarn install
           - name: Run tests
             run: yarn test
           - name: Build
             run: yarn build
           - name: Deploy to Firebase
             uses: FirebaseExtended/action-hosting-deploy@v0
             with:
               repoToken: '${{ secrets.GITHUB_TOKEN }}'
               firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
               channelId: live
     ```

3. **Versioning Strategy**
   - Implement semantic versioning:
     ```
     Major.Minor.Patch
     ```
   - Automate version bumping in package.json
   - Tag releases in Git

4. **Monitoring and Analytics**
   - Set up Firebase Performance Monitoring
   - Implement error tracking with Firebase Crashlytics
   - Configure Google Analytics for user behavior tracking
   - Create custom events for important game actions:
     ```typescript
     // src/services/firebase/analyticsService.ts
     import { getAnalytics, logEvent } from 'firebase/analytics';
     
     const analytics = getAnalytics();
     
     export const trackGameCreated = (gameMode: '3p' | '4p') => {
       logEvent(analytics, 'game_created', { game_mode: gameMode });
     };
     
     export const trackBidPlaced = (amount: number, isHonors: boolean) => {
       logEvent(analytics, 'bid_placed', { 
         bid_amount: amount,
         is_honors: isHonors 
       });
     };
     
     export const trackGameCompleted = (rounds: number, winnerType: 'declarer' | 'defender') => {
       logEvent(analytics, 'game_completed', { 
         rounds_played: rounds,
         winner_type: winnerType 
       });
     };
     ```

5. **Progressive Web App (PWA) Setup**
   - Implement PWA features for offline capabilities and installation:
     - Create manifest.json
     - Generate app icons
     - Register service worker
     - Configure offline caching strategy
   - Test PWA features on mobile devices

6. **Release Process**
   - Document the release checklist:
     1. Update version number in package.json
     2. Run full test suite
     3. Create GitHub release with changelog
     4. Deploy to staging environment
     5. Perform QA testing in staging
     6. Deploy to production
     7. Verify production deployment
     8. Monitor analytics and error reporting

7. **Rollback Strategy**
   - Create rollback plan for production issues
   - Set up Firebase Hosting versioning to enable quick rollbacks
   - Document rollback procedures

This structured deployment and release strategy ensures a reliable, professional development workflow with proper version control, quality assurance, and monitoring.

## Detailed Technical Implementation Guidelines

### Core Game Logic Module

The core game logic should be implemented as a standalone module that can work without Firebase. This ensures that the game can be played offline and makes testing easier.

```typescript
// Example structure for the core game logic module
export class GameEngine {
  constructor(playerCount: 3 | 4) {
    // Initialize game state based on player count
  }

  // Game setup methods
  initializeGame(): void
  dealFirstBatch(): Card[][]
  dealSecondBatch(): Card[][]

  // Bidding methods
  placeBid(playerId: string, amount: number): boolean
  passBid(playerId: string): boolean
  isValidBid(amount: number, currentPhase: GamePhase): boolean

  // Trump selection methods
  selectProvisionalTrump(playerId: string, card: Card): boolean
  selectFinalTrump(playerId: string, card: Card, keepProvisional?: boolean): boolean

  // Card playing methods
  playCard(playerId: string, card: Card): boolean
  isValidPlay(playerId: string, card: Card): boolean
  determineTrickWinner(trick: Trick, trumpSuit?: Suit): string
  
  // Trump reveal methods
  requestTrumpReveal(playerId: string): boolean
  
  // Scoring methods
  calculateRoundScore(): RoundScore
  updateGameScore(): GameScore
  isGameComplete(): boolean

  // State transition methods
  advanceToNextPhase(): void
  advanceToNextPlayer(): void
  startNextRound(): void
}
```

### State Management with Zustand

Zustand provides a simple and efficient way to manage game state. The store should be structured to handle both local and online gameplay.

```typescript
// Example Zustand store structure
interface GameState {
  // Game configuration
  gameMode: '3p' | '4p'
  isOnline: boolean
  
  // Game state
  currentPhase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  dealerIndex: number
  originalBidderIndex: number
  
  // Bidding state
  currentBids: Bid[]
  highestBid: Bid | null
  
  // Trump state
  provisionalTrumpSuit: Suit | null
  finalTrumpSuit: Suit | null
  trumpRevealed: boolean
  
  // Playing state
  currentTrick: Card[]
  trickLeaderIndex: number
  completedTricks: CompletedTrick[]
  
  // Scoring
  roundScores: RoundScore[]
  gameScores: GameScore
  
  // Actions
  initializeGame: (playerCount: 3 | 4, playerNames: string[]) => void
  placeBid: (amount: number) => void
  passBid: () => void
  selectTrump: (card: Card) => void
  playCard: (card: Card) => void
  requestTrumpReveal: () => void
  // ... other actions
}
```

### Firebase Integration

When integrating with Firebase, create adapter functions that convert between the local game state and Firebase data structures.

```typescript
// Example Firebase adapter
export class FirebaseGameAdapter {
  constructor(private gameId: string) {
    // Initialize Firebase references
  }

  // Convert local game state to Firebase format
  serializeGameState(state: GameState): FirebaseGameState {
    // Transform local state to Firebase format
  }

  // Convert Firebase data to local game state
  deserializeGameState(data: FirebaseGameState): GameState {
    // Transform Firebase data to local state
  }

  // Listen for game state changes
  subscribeToGameChanges(callback: (state: GameState) => void): Unsubscribe {
    // Set up Firestore onSnapshot listener
  }

  // Update game state in Firebase
  updateGameState(state: GameState): Promise<void> {
    // Update Firestore document
  }

  // Player-specific methods
  getPlayerHand(playerId: string): Promise<Card[]> {
    // Fetch player's hand from secure location
  }

  updatePlayerHand(playerId: string, hand: Card[]): Promise<void> {
    // Update player's hand in secure location
  }
}
```

### Separation of Concerns

Maintain clear separation between:

1. **Game Logic**: Rules enforcement, state transitions, calculations
2. **State Management**: Storage and updates of game state
3. **UI Components**: Visual representation and user interactions
4. **Service Layer**: Communication with external systems (Firebase)

This separation allows for:
- Easy switching between local and online play
- Independent testing of each layer
- Potential reuse of game logic in different UIs (e.g., mobile app)

### Security Considerations

For the Firebase implementation:

1. **Firestore Security Rules**: Ensure players can only:
   - Read game metadata they have access to
   - Read their own hand data
   - Read shared game state
   - Make valid game actions through Cloud Functions

2. **Cloud Functions**: Implement all game logic in Cloud Functions to:
   - Validate all game actions server-side
   - Prevent cheating by client-side manipulation
   - Ensure consistent game state for all players

3. **Player Hand Security**: Store player hands in separate documents with player-specific access controls

## Error Handling and Edge Cases

Implementing robust error handling is critical for a good user experience, especially in a complex card game with many rules. Here's how to approach error handling for different parts of the application:

### 1. Client-Side Validation

- **Preemptive Validation**:
  - Validate user actions before sending to server or updating local state:
  ```typescript
  // Example of client-side bid validation
  const validateBid = (amount: number): string | null => {
    if (amount < 14) {
      return 'Minimum bid is 14';
    }
    if (amount > 28) {
      return 'Maximum bid is 28';
    }
    if (currentPhase === 'bidding2') {
      const minRound2Bid = gameMode === '3p' ? 22 : 24;
      if (amount < minRound2Bid) {
        return `Minimum bid in Round 2 is ${minRound2Bid}`;
      }
    }
    if (highestBid && amount <= highestBid.amount) {
      return `Bid must be higher than the current highest bid (${highestBid.amount})`;
    }
    return null; // Valid bid
  };
  ```
  
- **User Interface Feedback**:
  - Display validation errors directly in UI components
  - Disable invalid actions (e.g., gray out cards that cannot be played)
  - Provide tooltips or help text explaining why an action is invalid

### 2. Game State Integrity

- **State Consistency Checks**:
  ```typescript
  // Check for state consistency periodically
  const verifyGameState = (state: GameState): boolean => {
    // Ensure each player has the correct number of cards
    for (const player of state.players) {
      const expectedCards = player.id === state.trumpState.finalDeclarerId ? 7 : 8;
      if (state.currentPhase === 'playing' && player.hand.length + player.tricksWon.flat().length / state.players.length !== expectedCards) {
        console.error('Card count mismatch detected');
        return false;
      }
    }
    
    // Other integrity checks...
    return true;
  };
  ```

- **Recovery Mechanisms**:
  - Implement auto-save and restore functionality
  - Allow restarting a round if a critical error is detected
  - Log detailed state for debugging

### 3. Network and Firebase Error Handling

- **Connectivity Issues**:
  ```typescript
  // Handle Firebase connection errors
  try {
    await updateGameState(gameId, newState);
  } catch (error) {
    if (error.code === 'unavailable') {
      // Network connectivity issue
      showOfflineIndicator();
      queuePendingChange(gameId, newState);
      return;
    }
    // Handle other errors
    handleFirebaseError(error);
  }
  ```

- **Firebase Permission Errors**:
  - Handle permission denied errors gracefully
  - Attempt to reauthenticate if token expired
  - Provide clear error messages about access issues

- **Timeout Handling**:
  - Set appropriate timeouts for network operations
  - Implement retry logic with exponential backoff
  - Provide feedback during long operations

### 4. Edge Cases in Game Rules

- **All Players Pass**:
  - Handle the situation where all players pass in Round 1
  - Implement reshuffle or special rules

- **Disconnections during Critical Phases**:
  - Handle player disconnection during trump selection
  - Implement timeouts for player actions
  - Allow for graceful game abandonment

- **Rule Variations**:
  - Handle different house rules or regional variations
  - Make rule variations configurable

### 5. Centralized Error Handler

- **Error Tracking Service**:
  ```typescript
  // src/services/errorService.ts
  export class ErrorService {
    private static instance: ErrorService;
    private errors: Error[] = [];
    
    private constructor() {}
    
    static getInstance(): ErrorService {
      if (!ErrorService.instance) {
        ErrorService.instance = new ErrorService();
      }
      return ErrorService.instance;
    }
    
    logError(error: Error, context?: any): void {
      console.error('Application error:', error, context);
      this.errors.push(error);
      
      // If in online mode, send to analytics
      if (navigator.onLine) {
        this.sendToAnalytics(error, context);
      }
      
      // Display appropriate UI error
      this.showErrorUI(error);
    }
    
    private sendToAnalytics(error: Error, context?: any): void {
      // Send to Firebase Analytics or Crashlytics
    }
    
    private showErrorUI(error: Error): void {
      // Display appropriate UI notification based on error type
    }
    
    getRecentErrors(): Error[] {
      return [...this.errors].slice(-10);
    }
    
    clearErrors(): void {
      this.errors = [];
    }
  }
  
  // Global error handler
  export const handleError = (error: Error, context?: any): void => {
    ErrorService.getInstance().logError(error, context);
  };
  ```

### 6. Error Boundary Components

- **React Error Boundaries**:
  ```typescript
  // src/components/ErrorBoundary.tsx
  import React, { Component, ErrorInfo, ReactNode } from 'react';
  
  interface Props {
    children: ReactNode;
    fallback?: ReactNode;
  }
  
  interface State {
    hasError: boolean;
    error?: Error;
  }
  
  export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
      // Log error to error service
      handleError(error, { errorInfo, component: this.constructor.name });
    }
    
    render(): ReactNode {
      if (this.state.hasError) {
        if (this.props.fallback) {
          return this.props.fallback;
        }
        
        return (
          <div className="error-container bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-700 font-medium mb-2">Something went wrong</h3>
            <p className="text-red-600 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  ```

### 7. Logging and Debugging

- **Structured Logging**:
  ```typescript
  // src/utils/logger.ts
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';
  
  interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
  }
  
  export class Logger {
    private logs: LogEntry[] = [];
    private maxLogs: number;
    
    constructor(maxLogs: number = 1000) {
      this.maxLogs = maxLogs;
    }
    
    log(level: LogLevel, message: string, data?: any): void {
      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        message,
        data
      };
      
      console[level](message, data);
      
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      // In development mode, persist logs to localStorage
      if (process.env.NODE_ENV === 'development') {
        try {
          localStorage.setItem('app_logs', JSON.stringify(this.logs));
        } catch (e) {
          console.warn('Failed to persist logs to localStorage', e);
        }
      }
    }
    
    debug(message: string, data?: any): void {
      this.log('debug', message, data);
    }
    
    info(message: string, data?: any): void {
      this.log('info', message, data);
    }
    
    warn(message: string, data?: any): void {
      this.log('warn', message, data);
    }
    
    error(message: string, data?: any): void {
      this.log('error', message, data);
    }
    