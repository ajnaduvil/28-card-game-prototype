import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState } from '../models/game';
import { Bid } from '../models/bid';
import {
    generateDeck,
    shuffleDeck,
    dealCards,
    calculateCardPoints,
    determineTrickWinner,
    isValidPlay
} from '../services/local/cardUtils';
import { produce } from "immer";
import { Card, Suit } from '../models/card';
import { v4 as uuidv4 } from 'uuid';
import { dealCards as dealingServiceDealCards } from '../services/local/dealingService';
import {
    canFollowSuit
} from '../services/local/cardUtils';
import { GameHistoryEntry } from '../models/game';

// Define the actions that can be performed on the game state
export interface GameActions {
    // Game initialization
    initializeGame: (playerNames: string[], gameMode?: "3p" | "4p") => void;
    startRound: () => void;

    // Bidding phase
    processBid: (playerId: string, amount: number | null, isHonors?: boolean) => boolean;

    // Trump selection phase
    selectProvisionalTrump: (playerId: string, cardId: string) => boolean;
    finalizeTrump: (playerId: string, keepProvisional: boolean, newTrumpCardId?: string) => boolean;

    // Playing phase
    playCard: (playerId: string, cardId: string) => boolean;
    requestTrumpReveal: () => boolean;
    declarerRevealTrump: (playerId: string) => boolean;

    // Trick completion
    confirmTrick: () => boolean;

    // History and debugging
    addToHistory: (action: string, payload: Record<string, unknown>) => void;
    goBackInHistory: () => void;
    goForwardInHistory: () => void;
    exitReplayMode: () => void;
    correctMove: (action: string, payload: Record<string, unknown>) => void;
}

// Game History Entry Interface
export interface GameHistoryEntry {
    stateSnapshot: Partial<GameState>;
    action: {
        type: string;
        payload: any;
    };
    timestamp: number;
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
        highestBid1: undefined,
        highestBid2: undefined,
        finalBid: undefined,
        trumpState: { trumpRevealed: false },
        currentTrick: null,
        completedTricks: [],
        roundScores: [],
        gameScores: {
            player1Points: 0,
            player2Points: 0,
            player3Points: 0,
            team1Points: undefined,
            team2Points: undefined
        },
        targetScore: 8, // Default target score to win the game
        isOnline: false,
        status: 'waiting',

        // History
        history: [],
        historyIndex: -1,
        isReplayMode: false,

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
                    hasPassedRound1: false,
                    isConnected: true
                }));

                state.dealerIndex = 0;
                state.originalBidderIndex = 1; // Right of dealer
                state.currentPlayerIndex = 1; // Original bidder starts

                // Reset scores if new game
                if (gameMode === '3p') {
                    state.gameScores = {
                        player1Points: 0,
                        player2Points: 0,
                        player3Points: 0,
                        team1Points: undefined,
                        team2Points: undefined
                    };
                } else {
                    state.gameScores = {
                        player1Points: 0,
                        player2Points: 0,
                        player3Points: 0,
                        team1Points: 0,
                        team2Points: 0
                    };
                }

                state.status = 'active';

                // Initialize history
                state.history = [];
                state.historyIndex = -1;
                state.isReplayMode = false;
            });

            // Start the first round immediately after initialization
            get().startRound();
        },

        // Start the game by dealing cards and starting bidding
        startRound: () => {
            let success = false;

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
                    player.hasPassedCurrentRound = false;
                    player.hasPassedRound1 = false;
                    player.tricksWon = [];
                });

                state.deck = remainingDeck;
                state.currentPhase = 'bidding1_start';
                success = true;
            });

            return success;
        },

        // Process a bid from a player
        processBid: (playerId, amount, isHonors = false) => {
            let success = false;

            set(state => {
                // Validate it's the player's turn
                const currentPlayer = state.players[state.currentPlayerIndex];
                if (currentPlayer.id !== playerId) {
                    console.error("Not your turn to bid");
                    return;
                }

                // Create bid object
                const bid: Bid = {
                    amount: amount || 0,
                    playerId,
                    isPass: amount === null,
                    isHonors: amount !== null && isHonors,
                    timestamp: Date.now()
                };

                const isBiddingRound1 = state.currentPhase === 'bidding1_start' ||
                    state.currentPhase === 'bidding1_in_progress';

                if (isBiddingRound1) {
                    // Handle first round bidding
                    state.bids1.push(bid);

                    // If passing, mark the player as passed
                    if (bid.isPass) {
                        currentPlayer.hasPassedCurrentRound = true;
                        currentPlayer.hasPassedRound1 = true;
                    }

                    // Update highest bid if applicable
                    if (!bid.isPass && (!state.highestBid1 || bid.amount > state.highestBid1.amount)) {
                        state.highestBid1 = bid;
                    }

                    // Find next player who hasn't passed
                    let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
                    while (state.players[nextPlayerIndex].hasPassedCurrentRound) {
                        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;

                        // If we've gone full circle, break
                        if (nextPlayerIndex === state.currentPlayerIndex) {
                            break;
                        }
                    }

                    // Check if bidding round is over
                    const remainingBidders = state.players.filter(p => !p.hasPassedCurrentRound);

                    if (remainingBidders.length === 1) {
                        // Only one player left, they won the bidding
                        state.currentPhase = 'bidding1_complete';

                        // Update trump state with provisional bidder
                        const provisionalBidderId = remainingBidders[0].id;
                        state.trumpState.provisionalBidderId = provisionalBidderId;
                        state.currentPlayerIndex = state.players.findIndex(p => p.id === provisionalBidderId);
                    } else {
                        // Bidding continues
                        state.currentPhase = 'bidding1_in_progress';
                        state.currentPlayerIndex = nextPlayerIndex;
                    }
                } else {
                    // Handle second round bidding
                    state.bids2.push(bid);

                    // If passing, mark the player as passed
                    if (bid.isPass) {
                        currentPlayer.hasPassedCurrentRound = true;
                    }

                    // Update highest bid if applicable
                    if (!bid.isPass && (!state.highestBid2 || bid.amount > state.highestBid2.amount)) {
                        state.highestBid2 = bid;
                        state.finalBid = bid;
                    }

                    // Find next player who hasn't passed in round 2
                    let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
                    while (state.players[nextPlayerIndex].hasPassedCurrentRound) {
                        nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;

                        // If we've gone full circle, break
                        if (nextPlayerIndex === state.currentPlayerIndex) {
                            break;
                        }
                    }

                    // Check if bidding round is over
                    const remainingBidders = state.players.filter(
                        p => !p.hasPassedCurrentRound
                    );

                    // If only one bidder left OR everyone has passed, end round 2
                    if (remainingBidders.length <= 1) {

                        // Determine the true overall highest bid and declarer
                        let finalBidOverall: Bid | undefined = state.highestBid1;
                        if (state.highestBid2 && (!finalBidOverall || state.highestBid2.amount > finalBidOverall.amount)) {
                            finalBidOverall = state.highestBid2;
                        }

                        let finalDeclarerIdOverall: string | undefined;
                        if (finalBidOverall) {
                            finalDeclarerIdOverall = finalBidOverall.playerId;
                        } else {
                            // Fallback if no bids at all (shouldn't happen with validation)
                            // If everyone passed R2, the R1 winner is the declarer
                            finalDeclarerIdOverall = state.trumpState.provisionalBidderId;
                            finalBidOverall = state.highestBid1; // Use R1 bid
                        }

                        if (finalDeclarerIdOverall) {
                            state.trumpState.finalDeclarerId = finalDeclarerIdOverall;
                            state.finalBid = finalBidOverall; // Set the correct final bid

                            // Set phase and current player for final trump selection
                            state.currentPhase = 'bidding2_complete';
                            state.currentPlayerIndex = state.players.findIndex(p => p.id === finalDeclarerIdOverall);
                        } else {
                            // Handle error: Could not determine declarer
                            console.error("Fatal Error: Could not determine final declarer.");
                            // Potentially reset the round or enter an error state
                        }

                        // NOTE: We no longer auto-set declarerChoseKeep or trumpRevealed here.
                        // The finalizeTrump function will handle the logic based on whether
                        // the highest bidder actually changed between rounds.

                    } else {
                        // Bidding continues
                        state.currentPhase = 'bidding2_in_progress';
                        state.currentPlayerIndex = nextPlayerIndex;
                    }
                }
            });

            // Set success flag before returning
            success = true;
        },

        // Select provisional trump by folding a card
        selectProvisionalTrump: (playerId, cardId) => {
            let success = false;

            set(state => {
                // Validate we're in the right phase
                if (state.currentPhase !== 'bidding1_complete') {
                    console.error("Not in provisional trump selection phase");
                    return;
                }

                // Find the card in the player's hand
                const currentPlayer = state.players[state.currentPlayerIndex];
                const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);

                if (cardIndex === -1) {
                    console.error("Card not found in player's hand");
                    return;
                }

                // Remove the card and set it as provisional trump
                const card = currentPlayer.hand[cardIndex];
                state.foldedCard = card;

                // Update trump state
                state.trumpState.provisionalTrumpSuit = card.suit;
                state.trumpState.provisionalTrumpCardId = card.id;

                // Remove card from player's hand
                currentPlayer.hand.splice(cardIndex, 1);

                // Deal 4 more cards to each player
                const { hands, remainingDeck } = dealCards(state.deck, state.players.length, 4);

                // Update player hands
                state.players.forEach((player, index) => {
                    player.hand = [...player.hand, ...hands[index]];
                    player.hasPassedCurrentRound = false; // Reset for second bidding round
                });

                // Update deck and move to next phase
                state.deck = remainingDeck;
                state.currentPhase = 'bidding2_start';

                // Bidding starts with original bidder again
                state.currentPlayerIndex = state.originalBidderIndex;
            });

            return success;
        },

        // Finalize trump selection (keep or change)
        finalizeTrump: (playerId, keepProvisional, newTrumpCardId) => {
            let success = false;

            set(state => {
                // Validate we're in the right phase
                if (state.currentPhase !== 'bidding2_complete') {
                    console.error("Not in final trump selection phase");
                    return;
                }

                // Validate we have a provisional trump
                if (!state.trumpState.provisionalTrumpSuit || !state.foldedCard) {
                    console.error("No provisional trump to keep or change");
                    return;
                }

                const currentPlayer = state.players[state.currentPlayerIndex];

                // Check if the current player (final declarer) is different from the provisional bidder
                const bidderChanged = state.trumpState.provisionalBidderId !== state.trumpState.finalDeclarerId;

                // If the bidder changed, we need to return the folded card to the original bidder first
                if (bidderChanged) {
                    console.log("Bidder changed - returning folded card to original bidder");

                    // Find the original bidder
                    const originalBidderIndex = state.players.findIndex(p => p.id === state.trumpState.provisionalBidderId);
                    if (originalBidderIndex !== -1) {
                        // Return the folded card to the original bidder
                        state.players[originalBidderIndex].hand.push(state.foldedCard);

                        // Mark the folded card as returned
                        state.trumpState.foldedCardReturned = true;

                        // The new bidder must select a new trump card (can't keep provisional)
                        keepProvisional = false;
                    }
                } else {
                    // If no change in the highest bid happened in round 2, must keep the provisional trump
                    // This happens when:
                    // 1. There were no actual bids (only passes) in Round 2, OR
                    // 2. The highest bidder from Round 1 is still the highest bidder in Round 2
                    const highestBidChanged =
                        state.highestBid2 && // There is a highest bid in Round 2
                        state.highestBid1 && // There was a highest bid in Round 1
                        state.highestBid2.playerId !== state.highestBid1.playerId; // Different player

                    if (!highestBidChanged) {
                        console.log("No change in highest bidder - must keep provisional trump");
                        keepProvisional = true;
                    }
                }

                if (keepProvisional && !bidderChanged) {
                    // Keep the provisional trump (only possible if bidder didn't change)
                    state.trumpState.finalTrumpSuit = state.trumpState.provisionalTrumpSuit;
                    state.trumpState.finalTrumpCardId = state.trumpState.provisionalTrumpCardId;
                    state.trumpState.declarerChoseKeep = true;
                } else {
                    // Change to a new trump
                    if (!newTrumpCardId) {
                        console.error("Must provide a new trump card ID when changing");
                        return;
                    }

                    // Find the new card
                    const cardIndex = currentPlayer.hand.findIndex(c => c.id === newTrumpCardId);
                    if (cardIndex === -1) {
                        console.error("New trump card not found in hand");
                        return;
                    }

                    const newTrumpCard = currentPlayer.hand[cardIndex];

                    // Update trump state
                    state.trumpState.finalTrumpSuit = newTrumpCard.suit;
                    state.trumpState.finalTrumpCardId = newTrumpCardId;
                    state.trumpState.declarerChoseNew = true;

                    // Remove the new trump card from the player's hand
                    currentPlayer.hand.splice(cardIndex, 1);

                    // Only add the folded card back if the bidder didn't change
                    // (if bidder changed, we already returned the card to the original bidder)
                    if (!bidderChanged) {
                        // Add the folded card back to the current player's hand
                        currentPlayer.hand.push(state.foldedCard);
                        state.trumpState.foldedCardReturned = true;
                    }

                    // Update folded card
                    state.foldedCard = newTrumpCard;
                }

                // Start the game with player to the left of dealer
                const firstPlayerIndex = (state.dealerIndex + 1) % state.players.length;
                state.currentPlayerIndex = firstPlayerIndex;

                // Initialize the first trick
                state.currentTrick = {
                    cards: [],
                    playedBy: [],
                    leaderId: state.players[firstPlayerIndex].id,
                    leadSuit: 'Hearts', // Will be updated when first card is played
                    timestamp: Date.now(),
                    points: 0
                };

                state.currentPhase = 'playing_start_trick';
            });

            return success;
        },

        // Play a card
        playCard: (playerId, cardId) => {
            console.log(`playCard called: playerId=${playerId}, cardId=${cardId}`);
            let success = false;

            set(state => {
                console.log(`Current phase: ${state.currentPhase}`);
                console.log(`Current player index: ${state.currentPlayerIndex}`);
                console.log(`Current trick:`, state.currentTrick);

                // *** NEW: Check for forced play of last card (folded trump) ***
                const currentPlayerIndex = state.currentPlayerIndex;
                const currentPlayer = state.players[currentPlayerIndex];
                const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;

                if (
                    isDeclarer &&
                    currentPlayer.hand.length === 1 &&
                    state.foldedCard &&
                    currentPlayer.hand[0].id === state.foldedCard.id &&
                    !state.trumpState.trumpRevealed // Ensure it wasn't already revealed
                ) {
                    console.log("Declarer's last card is folded trump. Forcing reveal and play.");

                    // Force reveal
                    state.trumpState.trumpRevealed = true;
                    state.trumpState.foldedCardReturned = true; // Mark as returned implicitly
                    // Optional: Log this specific reveal type?

                    // The card to play IS the folded card
                    cardId = state.foldedCard.id;
                }
                // *** END NEW CHECK ***

                // Validate we're in the right phase
                if (state.currentPhase !== 'playing_start_trick' &&
                    state.currentPhase !== 'playing_in_progress') {
                    console.error("Not in playing phase");
                    return;
                }

                // Validate it's the player's turn
                if (currentPlayer.id !== playerId) {
                    console.error("Not your turn to play");
                    return;
                }

                // Validate we have an active trick
                if (!state.currentTrick) {
                    console.error("No active trick");
                    return;
                }

                // Find the card in the player's hand
                const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
                if (cardIndex === -1) {
                    console.error("Card not found in hand");
                    return;
                }

                const card = currentPlayer.hand[cardIndex];

                // Validate the play using the utility function
                if (!isValidPlay(
                    card,
                    playerId,
                    currentPlayer.hand,
                    state.currentTrick!,
                    state.trumpState,
                    state.trumpState.finalDeclarerId
                )) {
                    console.error("Invalid card play attempt");
                    return; // Do not proceed with invalid play
                }

                // Remove card from player's hand
                currentPlayer.hand.splice(cardIndex, 1);

                // If this is the first card of the trick, set lead suit
                if (state.currentTrick.cards.length === 0) {
                    state.currentTrick.leadSuit = card.suit;
                    state.currentTrick.leaderId = currentPlayer.id;
                }

                // Add card to the trick
                state.currentTrick.cards.push(card);
                state.currentTrick.playedBy.push(playerId);

                // Check if trick is complete
                if (state.currentTrick.cards.length === state.players.length) {
                    // Determine trick winner
                    const winnerIndex = determineTrickWinner(state.currentTrick, state.trumpState);
                    const winnerPlayerId = state.currentTrick.playedBy[winnerIndex];
                    const winnerName = state.players.find(p => p.id === winnerPlayerId)?.name || 'Unknown';

                    // Calculate points in the trick
                    const trickPoints = calculateCardPoints(state.currentTrick.cards);

                    // Create the completed trick object
                    const completedTrick = {
                        ...state.currentTrick,
                        winnerId: winnerPlayerId,
                        points: trickPoints
                    };

                    console.log(`Trick completed! Winner: ${winnerName}, Points: ${trickPoints}`);
                    console.log('Setting game state to await confirmation');
                    console.log('Completed trick:', completedTrick);

                    // Instead of immediately moving to the next trick, set the game state to await confirmation
                    state.completedTrickAwaitingConfirmation = completedTrick;
                    state.currentTrick = null;
                    state.currentPhase = 'trick_completed_awaiting_confirmation';

                    // Log the state after changes
                    console.log('State after trick completion:');
                    console.log('- currentPhase:', state.currentPhase);
                    console.log('- completedTrickAwaitingConfirmation:', state.completedTrickAwaitingConfirmation);
                    console.log('- currentTrick:', state.currentTrick);

                    // Set a timeout to auto-confirm after 3 seconds
                    // Note: This is handled in the UI component, not here
                } else {
                    // Move to next player
                    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
                    state.currentPhase = 'playing_in_progress';
                }

                success = true;
            });

            return success;
        },

        // Declarer explicitly reveals trump (usually when playing a trump card)
        declarerRevealTrump: (playerId) => {
            let success = false;
            set(state => {
                // Validate phase
                if (
                    state.currentPhase !== 'playing_start_trick' &&
                    state.currentPhase !== 'playing_in_progress'
                ) {
                    console.error("Cannot reveal trump outside of playing phase.");
                    return;
                }

                // Validate player ID is the final declarer
                if (playerId !== state.trumpState.finalDeclarerId) {
                    console.error("Only the declarer can reveal trump this way.");
                    return;
                }

                // Validate trump isn't already revealed
                if (state.trumpState.trumpRevealed) {
                    console.warn("Trump is already revealed.");
                    return; // Or maybe still succeed but do nothing?
                }

                // Validate final trump is set
                if (!state.trumpState.finalTrumpSuit) {
                    console.error("Cannot reveal trump, final trump suit not set.");
                    return;
                }

                // Reveal the trump
                state.trumpState.trumpRevealed = true;
                success = true;
                console.log(`Declarer ${playerId} revealed trump: ${state.trumpState.finalTrumpSuit}`);

                // Return the folded card to the declarer's hand if it hasn't been returned yet
                if (!state.trumpState.foldedCardReturned && state.foldedCard) {
                    const declarerIndex = state.players.findIndex(
                        p => p.id === state.trumpState.finalDeclarerId
                    );

                    if (declarerIndex >= 0) {
                        // Check if the card isn't already somehow in hand (safety)
                        if (!state.players[declarerIndex].hand.some(c => c.id === state.foldedCard!.id)) {
                            state.players[declarerIndex].hand.push(state.foldedCard);
                        }
                        state.trumpState.foldedCardReturned = true;
                    }
                }
            });
            return success;
        },

        // Confirm a completed trick and move to the next trick
        confirmTrick: () => {
            let success = false;

            set(state => {
                // Validate we're in the right phase
                if (state.currentPhase !== 'trick_completed_awaiting_confirmation') {
                    console.error("No trick awaiting confirmation");
                    return;
                }

                if (!state.completedTrickAwaitingConfirmation) {
                    console.error("No trick awaiting confirmation");
                    return;
                }

                console.log("Confirming trick in store:", state.completedTrickAwaitingConfirmation);

                const completedTrick = state.completedTrickAwaitingConfirmation;
                const winnerPlayerId = completedTrick.winnerId;

                if (!winnerPlayerId) {
                    console.error("Trick has no winner");
                    return;
                }

                const winnerPlayerIndex = state.players.findIndex(p => p.id === winnerPlayerId);

                if (winnerPlayerIndex === -1) {
                    console.error("Winner player not found");
                    return;
                }

                // Add the completed trick to the winner's tricks
                const winnerPlayer = state.players[winnerPlayerIndex];
                winnerPlayer.tricksWon.push(completedTrick);

                // Add to completed tricks
                state.completedTricks.push(completedTrick);

                // Check if all cards have been played
                const allCardsPlayed = state.players.every(p => p.hand.length === 0);

                if (allCardsPlayed) {
                    // Round is complete
                    state.currentPhase = 'round_over';
                    state.currentTrick = null;
                    state.completedTrickAwaitingConfirmation = undefined;

                    // Score calculation would go here
                    console.log("Round over, all cards played");
                } else {
                    // Start a new trick with the winner as leader
                    state.currentTrick = {
                        cards: [],
                        playedBy: [],
                        leaderId: winnerPlayerId,
                        leadSuit: 'Hearts', // Placeholder
                        timestamp: Date.now(),
                        points: 0,
                        playerWhoAskedTrump: null // Reset asker for the new trick
                    };

                    state.currentPhase = 'playing_start_trick';
                    state.currentPlayerIndex = winnerPlayerIndex;
                    state.completedTrickAwaitingConfirmation = undefined;

                    console.log("Starting new trick with leader:", winnerPlayer.name);
                }
            });

            return success;
        },

        // Request trump reveal (by opponent)
        requestTrumpReveal: () => {
            let success = false;
            let askerId: string | null = null;

            set(state => {
                // Validate phase
                if (
                    state.currentPhase !== 'playing_start_trick' &&
                    state.currentPhase !== 'playing_in_progress'
                ) {
                    return;
                }

                // Other validations (trump not revealed, trick exists, etc.)
                if (
                    state.trumpState.trumpRevealed ||
                    !state.currentTrick ||
                    !state.trumpState.finalDeclarerId ||
                    !state.trumpState.finalTrumpSuit
                ) {
                    return;
                }

                const currentPlayer = state.players[state.currentPlayerIndex];
                askerId = currentPlayer.id; // Store the asker's ID

                // Validate current player is not the declarer
                if (currentPlayer.id === state.trumpState.finalDeclarerId) {
                    return; // Declarer cannot request trump reveal
                }

                // Validate player cannot follow suit
                const canFollowSuit = currentPlayer.hand.some(
                    card => card.suit === state.currentTrick!.leadSuit
                );
                if (canFollowSuit) {
                    return; // Player can follow suit, cannot request trump reveal
                }

                // Reveal the trump
                state.trumpState.trumpRevealed = true;
                state.currentTrick.playerWhoAskedTrump = askerId; // Set the asker in the trick
                success = true;

                // Return the folded card to the declarer's hand
                if (!state.trumpState.foldedCardReturned && state.foldedCard) {
                    const declarerIndex = state.players.findIndex(
                        p => p.id === state.trumpState.finalDeclarerId
                    );

                    if (declarerIndex >= 0) {
                        // Check if the card isn't already somehow in hand (safety)
                        if (!state.players[declarerIndex].hand.some(c => c.id === state.foldedCard!.id)) {
                            state.players[declarerIndex].hand.push(state.foldedCard);
                        }
                        state.trumpState.foldedCardReturned = true;
                        // Optional: Clear foldedCard if it represents only the *physical* folded state
                        // state.foldedCard = undefined;
                    }
                }
            });

            return success;
        },

        // Add history and debugging methods at end of store
        // Add current state to history
        addToHistory: (action, payload) => {
            if (get().isReplayMode) return; // Don't record history while in replay mode

            set(state => {
                // Create a partial snapshot of current state 
                // excluding history itself to avoid infinite recursion
                const { history, historyIndex, isReplayMode, ...stateForHistory } = state;

                // Create history entry
                const historyEntry: GameHistoryEntry = {
                    stateSnapshot: { ...stateForHistory },
                    action: {
                        type: action,
                        payload
                    },
                    timestamp: Date.now()
                };

                // Add to history
                state.history.push(historyEntry);
                state.historyIndex = state.history.length - 1;
            });
        },

        // Go back one step in history
        goBackInHistory: () => {
            set(state => {
                if (state.historyIndex <= 0) return; // Can't go back further

                // Enter replay mode if not already
                if (!state.isReplayMode) {
                    state.isReplayMode = true;
                }

                // Move back one step
                state.historyIndex--;

                // Apply the state from this history point
                const historyEntry = state.history[state.historyIndex];

                // Restore the state, preserving history-related properties
                const { history, historyIndex, isReplayMode } = state;
                Object.assign(state, historyEntry.stateSnapshot);
                state.history = history;
                state.historyIndex = historyIndex;
                state.isReplayMode = isReplayMode;
            });
        },

        // Go forward one step in history
        goForwardInHistory: () => {
            set(state => {
                if (!state.isReplayMode || state.historyIndex >= state.history.length - 1) return;

                // Move forward one step
                state.historyIndex++;

                // Apply the state from this history point
                const historyEntry = state.history[state.historyIndex];

                // Restore the state, preserving history-related properties
                const { history, historyIndex, isReplayMode } = state;
                Object.assign(state, historyEntry.stateSnapshot);
                state.history = history;
                state.historyIndex = historyIndex;
                state.isReplayMode = isReplayMode;

                // Exit replay mode if we've reached the end
                if (state.historyIndex === state.history.length - 1) {
                    state.isReplayMode = false;
                }
            });
        },

        // Exit replay mode and return to current state
        exitReplayMode: () => {
            set(state => {
                if (!state.isReplayMode) return;

                // Jump to most recent history entry
                state.historyIndex = state.history.length - 1;

                // Apply the state from this history point
                const historyEntry = state.history[state.historyIndex];

                // Restore the state, preserving history-related properties
                const { history, historyIndex } = state;
                Object.assign(state, historyEntry.stateSnapshot);
                state.history = history;
                state.historyIndex = historyIndex;
                state.isReplayMode = false;
            });
        },

        // Correct a move in history
        correctMove: (action, payload) => {
            set(state => {
                if (!state.isReplayMode) return;

                // Create a new history from current point forward
                const newHistory = state.history.slice(0, state.historyIndex + 1);

                // Add the corrected action
                const { history, historyIndex, isReplayMode, ...stateForHistory } = state;

                const historyEntry: GameHistoryEntry = {
                    stateSnapshot: { ...stateForHistory },
                    action: {
                        type: action,
                        payload
                    },
                    timestamp: Date.now()
                };

                newHistory.push(historyEntry);

                // Update history
                state.history = newHistory;
                state.historyIndex = newHistory.length - 1;
                state.isReplayMode = false;

                // Execute the corrected action
                // This would need specific handling per action type
                // For now, let's assume the corrected move will be re-played by the user
            });
        }
    }))
);