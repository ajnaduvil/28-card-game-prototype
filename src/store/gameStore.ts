import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Card } from '../models/card';
import { GameState } from '../models/game';
import { generateDeck, shuffleDeck, dealCards } from '../services/local/cardUtils';

// Define the actions that can be performed on the game state
interface GameActions {
    // Game initialization
    initializeGame: (playerNames: string[], gameMode?: '3p' | '4p') => void;
    startRound: () => void;

    // Bidding actions
    placeBid: (amount: number) => boolean;
    passBid: () => boolean;

    // Trump selection
    selectProvisionalTrump: (card: Card) => boolean;
    selectFinalTrump: (card: Card, keepProvisional?: boolean) => boolean;

    // Card playing
    playCard: (card: Card) => boolean;
    requestTrumpReveal: () => boolean;
}

// Create the store with immer middleware for easier state updates
export const useGameStore = create<GameState & GameActions>()(
    immer((set, get) => ({
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

        // Game initialization action
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
                    isDealer: index === 0, // First player is initial dealer
                    isOriginalBidder: index === 1, // Player to right of dealer starts bidding
                    tricksWon: [],
                    // In 4p mode, players 0,2 are team 0 and players 1,3 are team 1
                    team: gameMode === '4p' ? index % 2 : undefined,
                    hasPassedCurrentRound: false,
                    isConnected: true
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

        // Start a new round
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
                    player.initialHand = [...hands[index]];
                    player.activeCardCount = 4;
                    player.hasPassedCurrentRound = false;
                    player.hasPassedRound1 = false;
                    player.tricksWon = [];
                });

                state.deck = remainingDeck;
                state.currentPhase = 'bidding1_start';
            });
        },

        // Bidding actions
        placeBid: (amount) => {
            console.log(`Placing bid of ${amount}`); // Using parameter to avoid lint error
            // Implement bid validation and state update
            return true; // Placeholder
        },

        passBid: () => {
            // Implement pass bid logic
            return true; // Placeholder
        },

        // Trump selection actions
        selectProvisionalTrump: (card) => {
            console.log(`Selecting provisional trump: ${card.id}`); // Using parameter
            // Implement provisional trump selection
            return true; // Placeholder
        },

        selectFinalTrump: (card, keepProvisional) => {
            console.log(`Selecting final trump: ${card.id}, keep: ${!!keepProvisional}`); // Using parameters
            // Implement final trump selection
            return true; // Placeholder
        },

        // Card playing actions
        playCard: (card) => {
            console.log(`Playing card: ${card.id}`); // Using parameter
            // Implement card playing logic
            return true; // Placeholder
        },

        requestTrumpReveal: () => {
            // Implement trump reveal request
            return true; // Placeholder
        }
    }))
); 