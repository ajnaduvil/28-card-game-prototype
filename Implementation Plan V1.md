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
     hand: Card[];         // Cards in player's hand
     activeCardCount: number; // Number of cards player can play (7 for declarer, 8 for others)
     isDealer: boolean;    // Whether this player is the dealer
     isOriginalBidder: boolean; // Whether this player is the original bidder (to dealer's right)
     tricksWon: Card[][];  // Array of tricks (card arrays) won by this player
     team?: number;        // 0 or 1 (for 4p mode - partners are (0,2) and (1,3))
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
     'bidding1' | 
     'trump_selection_provisional' | 
     'dealing2' | 
     'bidding2' | 
     'trump_selection_final' | 
     'playing' | 
     'round_over' | 
     'game_over';

   export interface Trick {
     cards: Card[];          // Cards played in the trick
     leaderId: string;       // Player who led the trick
     leadSuit: Suit;         // Suit that was led
     winnerId?: string;      // Player who won the trick (if completed)
     timestamp: number;      // When trick started
   }

   export interface TrumpState {
     provisionalTrumpCard?: Card;    // Card folded in round 1 bidding
     provisionalTrumpSuit?: Suit;    // Suit of provisional trump
     finalTrumpCard?: Card;          // Card folded in final trump selection
     finalTrumpSuit?: Suit;          // Final trump suit for the round
     trumpRevealed: boolean;         // Whether trump has been revealed
     provisionalBidderId?: string;   // ID of player who won first bidding round
     finalDeclarerId?: string;       // ID of final declarer
     keepProvisionalTrump?: boolean; // Whether final declarer kept provisional trump
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
     
     // Bidding state
     bids1: Bid[];             // First round bids
     bids2: Bid[];             // Second round bids  
     highestBid1?: Bid;        // Highest bid from round 1
     highestBid2?: Bid;        // Highest bid from round 2
     finalBid?: Bid;           // Final winning bid
     
     // Trump state
     trumpState: TrumpState;
     
     // Playing state
     currentTrick: Trick;      // Current trick in progress
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
     hand: Card[],
     currentTrick: Trick,
     trumpSuit?: Suit,
     trumpRevealed: boolean = false
   ): boolean => {
     // If this is the first card of the trick, any card is valid
     if (currentTrick.cards.length === 0) return true;
     
     const leadSuit = currentTrick.leadSuit;
     
     // Check if player has any cards of the lead suit
     const hasSuit = hand.some(c => c.suit === leadSuit);
     
     // If player has the lead suit, they must play it
     if (hasSuit) {
       return card.suit === leadSuit;
     }
     
     // If trump is revealed and player has trump, they must play it
     if (trumpRevealed && trumpSuit) {
       const hasTrump = hand.some(c => c.suit === trumpSuit);
       if (hasTrump) {
         return card.suit === trumpSuit;
       }
     }
     
     // If player has neither lead suit nor trump, any card is valid
     return true;
   };
   
   // Determine the winner of a trick
   export const determineTrickWinner = (
     trick: Trick,
     trumpSuit?: Suit,
     trumpRevealed: boolean = false
   ): number => {
     if (trick.cards.length === 0) return -1;
     
     let winningCardIndex = 0;
     let winningCard = trick.cards[0];
     
     for (let i = 1; i < trick.cards.length; i++) {
       const currentCard = trick.cards[i];
       
       // If trump is revealed and this is a trump card
       if (trumpRevealed && trumpSuit && currentCard.suit === trumpSuit) {
         // If the winning card is not trump, or this trump is higher
         if (winningCard.suit !== trumpSuit || currentCard.order > winningCard.order) {
           winningCard = currentCard;
           winningCardIndex = i;
         }
       }
       // If not trump and same suit as lead card
       else if (currentCard.suit === trick.leadSuit) {
         // If winning card is not trump and this card is higher
         if ((trumpRevealed && winningCard.suit !== trumpSuit) || !trumpRevealed) {
           if (winningCard.suit === trick.leadSuit && currentCard.order > winningCard.order) {
             winningCard = currentCard;
             winningCardIndex = i;
           }
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
       currentTrick: { cards: [], leaderId: '', leadSuit: 'Hearts', timestamp: 0 },
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
             activeCardCount: 0,
             isDealer: index === 0, // First player is initial dealer
             isOriginalBidder: index === 1, // Player to right of dealer starts bidding
             tricksWon: [],
             // In 4p mode, players 0,2 are team 0 and players 1,3 are team 1
             team: gameMode === '4p' ? index % 2 : undefined
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
           state.currentTrick = { 
             cards: [], 
             leaderId: state.players[state.originalBidderIndex].id,
             leadSuit: 'Hearts', // This will be set when first card is played
             timestamp: Date.now() 
           };
           state.completedTricks = [];
           
           // Deal first batch of 4 cards
           state.currentPhase = 'dealing1';
           const { hands, remainingDeck } = dealCards(newDeck, state.players.length, 4);
           
           // Update player hands
           state.players.forEach((player, index) => {
             player.hand = hands[index];
             player.activeCardCount = 4;
           });
           
           state.deck = remainingDeck;
           state.currentPhase = 'bidding1';
         });
       },
       
       // Additional actions to be implemented...
     }))
   );
   ```

2. **Core Game Rules Implementation**

   - **Bidding Rules and Validation**:
     - Implement functions to validate and process bids:
     ```typescript
     // Check if a bid is valid based on current game state
     const isValidBid = (
       amount: number, 
       currentBids: Bid[], 
       highestBid: Bid | null,
       currentPhase: GamePhase, 
       gameMode: '3p' | '4p'
     ): boolean => {
       // Always allow pass
       if (amount === 0) return true;
       
       // Bids must be integers between 14 and 28
       if (!Number.isInteger(amount) || amount < 14 || amount > 28) {
         return false;
       }
       
       // Minimum bid requirements for round 2
       if (currentPhase === 'bidding2') {
         const minRound2Bid = gameMode === '3p' ? 22 : 24;
         
         // If highest R1 bid is less than minimum R2 bid, enforce minimum R2 bid
         if (highestBid === null || (highestBid && highestBid.amount < minRound2Bid)) {
           return amount >= minRound2Bid;
         } 
         // If highest R1 bid is already >= min R2 bid, new bid must be higher
         else if (highestBid) {
           return amount > highestBid.amount;
         }
       }
       
       // In round 1, or if no valid highest bid yet, just check it's higher
       if (highestBid === null) return true;
       return amount > highestBid.amount;
     };
     
     // Add bid action
     placeBid: (amount: number) => {
       const state = get();
       const { currentPhase, currentPlayerIndex, players, bids1, bids2, highestBid1, highestBid2 } = state;
       
       // Determine which bid array and highest bid to work with
       const bidArray = currentPhase === 'bidding1' ? bids1 : bids2;
       const highestBid = currentPhase === 'bidding1' ? highestBid1 : highestBid2;
       
       // Check if bid is valid
       if (!isValidBid(amount, bidArray, highestBid || null, currentPhase, state.gameMode)) {
         console.error('Invalid bid');
         return false;
       }
       
       const currentPlayer = players[currentPlayerIndex];
       
       // Create new bid
       const newBid: Bid = {
         amount,
         playerId: currentPlayer.id,
         isPass: amount === 0, // 0 amount means pass
         isHonors: currentPhase === 'bidding1' && (
           (state.gameMode === '3p' && amount > 18) ||
           (state.gameMode === '4p' && amount > 20)
         ),
         timestamp: Date.now()
       };
       
       set(state => {
         // Add bid to appropriate array
         if (currentPhase === 'bidding1') {
           state.bids1.push(newBid);
           if (!newBid.isPass && (highestBid1 === undefined || newBid.amount > highestBid1.amount)) {
             state.highestBid1 = newBid;
           }
         } else {
           state.bids2.push(newBid);
           if (!newBid.isPass && (highestBid2 === undefined || newBid.amount > highestBid2.amount)) {
             state.highestBid2 = newBid;
           }
         }
         
         // Move to next player
         state.currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
         
         // Check if bidding round is complete
         checkBiddingCompletion(state);
       });
       
       return true;
     },
     
     // Pass bid action
     passBid: () => get().placeBid(0),
     ```

   - **Trump Selection and Folding Mechanics**:
     - Implement provisional trump selection (after Round 1 bidding):
     ```typescript
     selectProvisionalTrump: (card: Card) => {
       const state = get();
       const { trumpState, currentPlayerIndex, players, highestBid1 } = state;
       
       // Validate player is the round 1 highest bidder
       if (!highestBid1 || players[currentPlayerIndex].id !== highestBid1.playerId) {
         console.error('Only the Round 1 highest bidder can select provisional trump');
         return false;
       }
       
       // Validate the card is in player's hand
       const player = players[currentPlayerIndex];
       const cardIndex = player.hand.findIndex(c => c.id === card.id);
       if (cardIndex === -1) {
         console.error('Card not in player hand');
         return false;
       }
       
       set(state => {
         // Store the provisional trump card and suit
         state.trumpState.provisionalTrumpCard = card;
         state.trumpState.provisionalTrumpSuit = card.suit;
         state.trumpState.provisionalBidderId = player.id;
         
         // Remove the folded card from player's hand
         state.players[currentPlayerIndex].hand.splice(cardIndex, 1);
         state.players[currentPlayerIndex].activeCardCount--;
         
         // Move to dealing second batch
         state.currentPhase = 'dealing2';
         
         // Deal second batch of cards
         const { hands, remainingDeck } = dealCards(state.deck, state.players.length, 4);
         state.players.forEach((p, i) => {
           p.hand = [...p.hand, ...hands[i]];
           p.activeCardCount += 4;
         });
         state.deck = remainingDeck;
         
         // Move to second bidding round
         state.currentPhase = 'bidding2';
       });
       
       return true;
     },
     
     // Final trump selection after Round 2 bidding
     selectFinalTrump: (card: Card, keepProvisional: boolean = false) => {
       const state = get();
       const { 
         trumpState, currentPlayerIndex, players, 
         highestBid1, highestBid2, bids1, bids2
       } = state;
       
       // Determine final bid and bidder
       const finalBid = highestBid2 || highestBid1;
       if (!finalBid) {
         console.error('No valid bid found');
         return false;
       }
       
       // Validate current player is the final highest bidder
       if (players[currentPlayerIndex].id !== finalBid.playerId) {
         console.error('Only the final highest bidder can select final trump');
         return false;
       }
       
       // Handle the case where Bidder 1 is also the Final Declarer
       const isSameBidder = trumpState.provisionalBidderId === finalBid.playerId;
       
       // If keeping provisional trump (only possible if same bidder)
       if (keepProvisional && isSameBidder) {
         if (!trumpState.provisionalTrumpSuit || !trumpState.provisionalTrumpCard) {
           console.error('No provisional trump to keep');
           return false;
         }
         
         set(state => {
           state.trumpState.finalTrumpSuit = state.trumpState.provisionalTrumpSuit;
           state.trumpState.finalTrumpCard = state.trumpState.provisionalTrumpCard;
           state.trumpState.finalDeclarerId = finalBid.playerId;
           state.trumpState.keepProvisionalTrump = true;
           
           // Save the final bid
           state.finalBid = finalBid;
           
           // Move to playing phase
           state.currentPhase = 'playing';
           
           // Original bidder (right of dealer) leads first trick
           state.currentPlayerIndex = state.originalBidderIndex;
         });
         
         return true;
       }
       
       // Selecting new trump
       // First validate the card is in player's hand
       const player = players[currentPlayerIndex];
       const cardIndex = player.hand.findIndex(c => c.id === card.id);
       if (cardIndex === -1) {
         console.error('Card not in player hand');
         return false;
       }
       
       set(state => {
         // If same bidder and not keeping provisional, return provisional card to hand
         if (isSameBidder && !keepProvisional && trumpState.provisionalTrumpCard) {
           state.players[currentPlayerIndex].hand.push(trumpState.provisionalTrumpCard);
           state.players[currentPlayerIndex].activeCardCount++;
         }
         
         // Store the final trump card and suit
         state.trumpState.finalTrumpSuit = card.suit;
         state.trumpState.finalTrumpCard = card;
         state.trumpState.finalDeclarerId = player.id;
         state.trumpState.keepProvisionalTrump = false;
         
         // Remove the folded card from player's hand
         state.players[currentPlayerIndex].hand.splice(cardIndex, 1);
         state.players[currentPlayerIndex].activeCardCount--;
         
         // Save the final bid
         state.finalBid = finalBid;
         
         // Move to playing phase
         state.currentPhase = 'playing';
         
         // Original bidder (right of dealer) leads first trick
         state.currentPlayerIndex = state.originalBidderIndex;
       });
       
       return true;
     },
     ```

   - **Card Playing and Trick Logic**:
     - Implement card playing with rule validation:
     ```typescript
     // Play a card action
     playCard: (card: Card) => {
       const state = get();
       const { 
         currentPhase, currentPlayerIndex, players, 
         currentTrick, trumpState, completedTricks 
       } = state;
       
       // Validate phase is playing
       if (currentPhase !== 'playing') {
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
         trumpState.finalTrumpSuit, 
         trumpState.trumpRevealed
       )) {
         console.error('Invalid card play - must follow suit or play trump if possible');
         return false;
       }
       
       // Handle special case: If player is declarer and unable to follow suit
       // and plays a card of the trump suit, trump is revealed
       const isFirstCardInTrick = currentTrick.cards.length === 0;
       const isDeclarer = currentPlayer.id === trumpState.finalDeclarerId;
       
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
           if (state.trumpState.finalTrumpCard && 
               !state.trumpState.keepProvisionalTrump) {
             state.players[currentPlayerIndex].hand.push(state.trumpState.finalTrumpCard);
             state.players[currentPlayerIndex].activeCardCount++;
           }
         }
         
         // If trick is complete
         if (state.currentTrick.cards.length === state.players.length) {
           // Determine trick winner
           const winningCardIndex = determineTrickWinner(
             state.currentTrick, 
             state.trumpState.finalTrumpSuit, 
             state.trumpState.trumpRevealed
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
     
     // Request trump reveal action (for non-declarer who can't follow suit)
     requestTrumpReveal: () => {
       const state = get();
       const { currentPhase, currentPlayerIndex, players, trumpState, currentTrick } = state;
       
       // Validation checks
       if (currentPhase !== 'playing') {
         console.error('Can only request trump reveal during playing phase');
         return false;
       }
       
       if (trumpState.trumpRevealed) {
         console.error('Trump already revealed');
         return false;
       }
       
       const currentPlayer = players[currentPlayerIndex];
       
       // Player can't be the declarer
       if (currentPlayer.id === trumpState.finalDeclarerId) {
         console.error('Declarer cannot ask for trump reveal');
         return false;
       }
       
       // Must not be the first card in a trick
       if (currentTrick.cards.length === 0) {
         console.error('Cannot ask for trump reveal when leading a trick');
         return false;
       }
       
       // Must be unable to follow suit
       const canFollowSuit = currentPlayer.hand.some(c => c.suit === currentTrick.leadSuit);
       if (canFollowSuit) {
         console.error('Cannot ask for trump reveal when able to follow suit');
         return false;
       }
       
       set(state => {
         // Reveal trump
         state.trumpState.trumpRevealed = true;
         
         // Find the declarer index
         const declarerIndex = state.players.findIndex(p => 
           p.id === state.trumpState.finalDeclarerId
         );
         
         // If declarer has the folded trump card, add it back to their hand
         if (declarerIndex >= 0 && state.trumpState.finalTrumpCard && 
             !state.trumpState.keepProvisionalTrump) {
           state.players[declarerIndex].hand.push(state.trumpState.finalTrumpCard);
           state.players[declarerIndex].activeCardCount++;
         }
       });
       
       return true;
     },
     ```

   - **Scoring and Round Completion**:
     - Implement score calculation based on game rules:
     ```typescript
     // Helper function to calculate round results
     const calculateRoundResults = (state: GameState) => {
       // Get relevant state
       const { players, trumpState, finalBid, gameMode } = state;
       
       if (!finalBid || !trumpState.finalDeclarerId) return;
       
       // Find the declarer and their partner (if 4p)
       const declarerIndex = players.findIndex(p => p.id === trumpState.finalDeclarerId);
       
       let declarerPoints = 0;
       let opponentPoints = 0;
       
       // Calculate points won by each side
       if (gameMode === '3p') {
         // In 3p, declarer is solo against temporary alliance of other two
         declarerPoints = players[declarerIndex].tricksWon
           .flat()
           .reduce((sum, card) => sum + card.pointValue, 0);
         
         // All other players' points combined
         opponentPoints = players
           .filter((_, i) => i !== declarerIndex)
           .flatMap(p => p.tricksWon.flat())
           .reduce((sum, card) => sum + card.pointValue, 0);
       } else {
         // In 4p, two teams - declarer's team vs opponents
         const declarerTeam = players[declarerIndex].team;
         
         // Sum points for each team
         players.forEach(player => {
           const points = player.tricksWon
             .flat()
             .reduce((sum, card) => sum + card.pointValue, 0);
           
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
       
       // Check if bid was from round 1 or round 2
       const isRound1Bid = !state.highestBid2 || state.highestBid2.isPass;
       
       if (isRound1Bid) {
         // Normal vs Honors bid logic for Round 1
         if (finalBid.isHonors) {
           // Honors bid from Round 1
           gamePointsChange = declarerWon ? 2 : -2;
         } else {
           // Normal bid from Round 1
           gamePointsChange = declarerWon ? 1 : -1;
         }
       } else {
         // Round 2 bid logic
         if (gameMode === '3p') {
           // 3-player mode Round 2 bid
           gamePointsChange = declarerWon ? 2 : -4;
         } else {
           // 4-player mode Round 2 bid
           gamePointsChange = declarerWon ? 2 : -3;
         }
       }
       
       // Create round score record
       const roundScore: RoundScore = {
         roundNumber: state.roundNumber,
         declarerPoints,
         opponentPoints,
         contract: finalBid.amount,
         bid1Amount: state.highestBid1?.amount,
         bid2Amount: state.highestBid2?.amount,
         isHonors: finalBid.isHonors,
         declarerWon,
         gamePointsChange,
         timestamp: Date.now()
       };
       
       // Update round scores array
       state.roundScores.push(roundScore);
       
       // Update game scores based on game mode
       if (gameMode === '3p') {
         // Update individual scores for 3p
         const playerKeys = ['player1Points', 'player2Points', 'player3Points'];
         if (declarerWon) {
           // Declarer won, gets points
           state.gameScores[playerKeys[declarerIndex]] += Math.abs(gamePointsChange);
         } else {
           // Opponents won, they get points
           players.forEach((player, index) => {
             if (index !== declarerIndex) {
               state.gameScores[playerKeys[index]] += Math.abs(gamePointsChange) / 2;
             }
           });
         }
       } else {
         // Update team scores for 4p
         const declarerTeam = players[declarerIndex].team;
         if (declarerWon) {
           // Declarer's team won
           state.gameScores[declarerTeam === 0 ? 'team1Points' : 'team2Points'] += 
             Math.abs(gamePointsChange);
         } else {
           // Opponent team won
           state.gameScores[declarerTeam === 0 ? 'team2Points' : 'team1Points'] += 
             Math.abs(gamePointsChange);
         }
       }
       
       // Check if game is over based on target score
       const isGameOver = checkGameOver(state);
       
       // Update game phase
       state.currentPhase = isGameOver ? 'game_over' : 'round_over';
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
     
     // Start next round action
     startNextRound: () => {
       const state = get();
       
       if (state.currentPhase !== 'round_over') {
         console.error('Cannot start next round - current round not over');
         return false;
       }
       
       set(state => {
         // Increment round number
         state.roundNumber++;
         
         // Rotate dealer (clockwise)
         state.dealerIndex = (state.dealerIndex + 1) % state.players.length;
         
         // Set original bidder to player right of dealer
         state.originalBidderIndex = (state.dealerIndex + 1) % state.players.length;
         
         // Reset player-specific state
         state.players.forEach(player => {
           player.hand = [];
           player.activeCardCount = 0;
           player.tricksWon = [];
           player.isDealer = false;
           player.isOriginalBidder = false;
         });
         
         // Mark new dealer and original bidder
         state.players[state.dealerIndex].isDealer = true;
         state.players[state.originalBidderIndex].isOriginalBidder = true;
       });
       
       // Start new round
       get().startRound();
       return true;
     },
     ```

3. **Game Flow Control**
   - The game flow is controlled through phase transitions:
     1. `setup` → Initialize players and settings
     2. `dealing1` → Deal first batch of 4 cards
     3. `bidding1` → First round of bidding
     4. `trump_selection_provisional` → Round 1 winner selects provisional trump
     5. `dealing2` → Deal second batch of 4 cards
     6. `bidding2` → Second round of bidding
     7. `trump_selection_final` → Final bid winner selects final trump
     8. `playing` → Playing phase (8 tricks)
     9. `round_over` → Round completed, scores calculated
     10. `game_over` → Game completed when target score reached

   - The functions above handle these transitions automatically based on game actions
   - Helper function to check and handle bidding completion:
   
   ```typescript
   // Helper to check if bidding round is complete and handle transition
   const checkBiddingCompletion = (state: GameState) => {
     const { currentPhase, bids1, bids2, highestBid1, players } = state;
     
     if (currentPhase === 'bidding1') {
       const allPassed = bids1.length >= players.length &&
         bids1.slice(-players.length).every(bid => bid.isPass);
       
       // If all players passed in Round 1, restart the round
       if (allPassed && !highestBid1) {
         // In real game, usually deck would be re-shuffled or different rule applied
         // Here we just restart the round
         state.bids1 = [];
         state.currentPlayerIndex = state.originalBidderIndex;
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
     } else if (currentPhase === 'bidding2') {
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
   - Hide/show hands based on current player

3. **Game State Persistence**
   - Save game state to localStorage to allow resuming games
   - Implement game history tracking

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

1. **Manual Testing**
   - Test all game rules and edge cases
   - Verify scoring logic
   - Test UI on different devices and screen sizes

2. **Bug Fixes and Improvements**
   - Address any issues found during testing
   - Refine UI based on playability feedback

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
    