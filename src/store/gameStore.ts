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

// Define the actions that can be performed on the game state
interface GameActions {
    // Game initialization
    initializeGame: (playerNames: string[], gameMode?: '3p' | '4p') => void;
    startGame: () => void;

    // Bidding actions
    processBid: (playerId: string, amount: number | null, isHonors?: boolean) => void;

    // Trump selection
    selectProvisionalTrump: (cardId: string) => void;
    finalizeTrump: (keepProvisional: boolean, newTrumpCardId?: string) => void;

    // Card playing
    playCard: (playerId: string, cardId: string) => void;
    requestTrumpReveal: () => boolean;

    // Declarer explicitly reveals trump (usually when playing a trump card)
    declarerRevealTrump: (playerId: string) => boolean;
}

// Create the store with immer middleware for easier state updates
export const useGameStore = create<GameState & GameActions>()(
    immer((set) => ({
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
            });
        },

        // Start the game by dealing cards and starting bidding
        startGame: () => {
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
            });
        },

        // Process a bid from a player
        processBid: (playerId, amount, isHonors = false) => {
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
        },

        // Select provisional trump by folding a card
        selectProvisionalTrump: (cardId) => {
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
        },

        // Finalize trump selection (keep or change)
        finalizeTrump: (keepProvisional, newTrumpCardId) => {
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

                if (keepProvisional) {
                    // Keep the provisional trump
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

                    // Swap cards (remove new trump, add folded card back)
                    const foldedCard = state.foldedCard;
                    currentPlayer.hand.splice(cardIndex, 1);
                    currentPlayer.hand.push(foldedCard);
                    state.trumpState.foldedCardReturned = true;

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
        },

        // Play a card
        playCard: (playerId, cardId) => {
            let success = false;

            set(state => {
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
                    const winnerPlayer = state.players.find(p => p.id === winnerPlayerId);

                    if (!winnerPlayer) {
                        console.error("Could not find winner player");
                        return;
                    }

                    // Calculate points in the trick
                    const trickPoints = calculateCardPoints(state.currentTrick.cards);

                    // Add to completed tricks
                    const completedTrick = {
                        ...state.currentTrick,
                        winnerId: winnerPlayerId,
                        points: trickPoints
                    };

                    state.completedTricks.push(completedTrick);
                    winnerPlayer.tricksWon.push(completedTrick);

                    // Check if all cards have been played
                    const allCardsPlayed = state.players.every(p => p.hand.length === 0);

                    if (allCardsPlayed) {
                        // Round is complete
                        state.currentPhase = 'round_over';
                        state.currentTrick = null;

                        // Score calculation would go here
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
                        state.currentPlayerIndex = state.players.findIndex(p => p.id === winnerPlayerId);
                    }
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
        }
    }))
); 