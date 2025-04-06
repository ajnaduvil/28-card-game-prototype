import { v4 as uuidv4 } from 'uuid';
import { GameState, Trick, TrumpState, GamePhase, GameScore } from '../../models/game';
import { Player } from '../../models/player';
import { Bid } from '../../models/bid';
import { generateDeck, shuffleDeck, dealCards, determineTrickWinner, calculateCardPoints, isValidPlay as validatePlay } from './cardUtils';

/**
 * Initialize a new game state
 */
export const initializeGame = (
    playerNames: string[],
    gameMode: '3p' | '4p',
    targetScore: number = 28
): GameState => {
    if ((gameMode === '3p' && playerNames.length !== 3) ||
        (gameMode === '4p' && playerNames.length !== 4)) {
        throw new Error(`Invalid number of players for ${gameMode} mode`);
    }

    // Create players
    const players: Player[] = playerNames.map((name, index) => ({
        id: uuidv4(),
        name,
        position: index,
        hand: [],
        isDealer: index === 0, // First player is dealer initially
        isOriginalBidder: index === 1, // Player to the right of dealer is original bidder
        tricksWon: [],
        hasPassedCurrentRound: false,
        team: gameMode === '4p' ? index % 2 : undefined, // In 4p mode, players 0,2 and 1,3 are teammates
    }));

    // Create initial game scores based on game mode
    const gameScores: GameScore = gameMode === '3p'
        ? { player1Points: 0, player2Points: 0, player3Points: 0, team1Points: undefined, team2Points: undefined }
        : { player1Points: 0, player2Points: 0, player3Points: 0, team1Points: 0, team2Points: 0 };

    // Create initial game state
    const gameState: GameState = {
        id: uuidv4(),
        createdAt: Date.now(),
        gameMode,
        currentPhase: 'setup',
        roundNumber: 1,

        players,
        currentPlayerIndex: 1, // Start with player to right of dealer
        dealerIndex: 0,
        originalBidderIndex: 1,

        deck: [],

        // Bidding state
        bids1: [],
        bids2: [],

        // Trump state
        trumpState: {
            trumpRevealed: false,
        },

        // Playing state
        currentTrick: null,
        completedTricks: [],

        // Scoring
        roundScores: [],
        gameScores,

        targetScore,

        // Metadata
        isOnline: false,
        status: 'waiting',
    };

    return gameState;
};

/**
 * Deal cards to players
 */
export const dealInitialCards = (gameState: GameState): GameState => {
    const { gameMode, players } = gameState;

    // Generate and shuffle deck
    let deck = generateDeck(gameMode);
    deck = shuffleDeck(deck);

    // Deal 4 cards to each player for first round
    const { hands, remainingDeck } = dealCards(deck, players.length, 4);

    // Update player hands
    const updatedPlayers = players.map((player, index) => ({
        ...player,
        hand: hands[index],
        initialHand: hands[index], // Store initial hand for reference
    }));

    return {
        ...gameState,
        players: updatedPlayers,
        deck: remainingDeck,
        currentPhase: 'bidding1_start',
    };
};

/**
 * Process a bid during bidding rounds
 */
export const processBid = (
    gameState: GameState,
    playerId: string,
    bidAmount: number | null, // null means pass
    isHonors: boolean = false
): GameState => {
    const { currentPhase, players, currentPlayerIndex } = gameState;

    // Validate that it's the player's turn
    if (players[currentPlayerIndex].id !== playerId) {
        throw new Error('Not your turn to bid');
    }

    // Check if we're in a bidding phase
    if (currentPhase !== 'bidding1_in_progress' &&
        currentPhase !== 'bidding1_start' &&
        currentPhase !== 'bidding2_in_progress' &&
        currentPhase !== 'bidding2_start') {
        throw new Error('Not in bidding phase');
    }

    // Create the bid object if not passing
    let newBid: Bid | null = null;
    if (bidAmount !== null) {
        newBid = {
            amount: bidAmount,
            playerId,
            isPass: false,
            isHonors,
            timestamp: Date.now(),
        };
    } else {
        // Player is passing
        newBid = {
            amount: 0,
            playerId,
            isPass: true,
            isHonors: false,
            timestamp: Date.now(),
        };
    }

    // Handle the bid based on current phase
    let nextState = { ...gameState };

    if (currentPhase === 'bidding1_start' || currentPhase === 'bidding1_in_progress') {
        // First bidding round
        nextState = handleBidRound1(nextState, newBid);
    } else {
        // Second bidding round
        nextState = handleBidRound2(nextState, newBid);
    }

    return nextState;
};

/**
 * Handle bid for first round
 */
const handleBidRound1 = (gameState: GameState, bid: Bid): GameState => {
    const { players, bids1, currentPlayerIndex } = gameState;

    // Add this bid to the bids array
    const newBids = [...bids1, bid];

    // Mark player as passed if they passed
    const updatedPlayers = [...players];
    if (bid.isPass) {
        updatedPlayers[currentPlayerIndex] = {
            ...updatedPlayers[currentPlayerIndex],
            hasPassedCurrentRound: true,
            hasPassedRound1: true,
        };
    }

    // Find highest bid so far
    const highestBid = newBids
        .filter(b => !b.isPass)
        .sort((a, b) => b.amount - a.amount)[0] || null;

    // Calculate next player (could be same player if all others passed)
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Skip players who have already passed
    while (updatedPlayers[nextPlayerIndex].hasPassedCurrentRound) {
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;

        // If we've come full circle, break to avoid infinite loop
        if (nextPlayerIndex === currentPlayerIndex) {
            break;
        }
    }

    // Check if bidding round is over (all but one player passed)
    const remainingBidders = updatedPlayers.filter(p => !p.hasPassedCurrentRound);

    let nextPhase: GamePhase = 'bidding1_in_progress';
    if (remainingBidders.length === 1 && newBids.length > 0) {
        // Only one player left, they won the bidding
        nextPhase = 'bidding1_complete';

        // Update trump state with provisional bidder
        const provisionalBidderId = remainingBidders[0].id;
        return {
            ...gameState,
            players: updatedPlayers,
            bids1: newBids,
            highestBid1: highestBid,
            currentPlayerIndex: updatedPlayers.findIndex(p => p.id === provisionalBidderId),
            currentPhase: nextPhase,
            trumpState: {
                ...gameState.trumpState,
                provisionalBidderId,
            },
        };
    }

    return {
        ...gameState,
        players: updatedPlayers,
        bids1: newBids,
        highestBid1: highestBid,
        currentPlayerIndex: nextPlayerIndex,
        currentPhase: nextPhase,
    };
};

/**
 * Handle bid for second round
 */
const handleBidRound2 = (gameState: GameState, bid: Bid): GameState => {
    const { players, bids2, currentPlayerIndex, trumpState } = gameState;

    // Add this bid to the bids array
    const newBids = [...bids2, bid];

    // Mark player as passed if they passed
    const updatedPlayers = [...players];
    if (bid.isPass) {
        updatedPlayers[currentPlayerIndex] = {
            ...updatedPlayers[currentPlayerIndex],
            hasPassedCurrentRound: true,
        };
    }

    // Find highest bid so far
    const highestBid = newBids
        .filter(b => !b.isPass)
        .sort((a, b) => b.amount - a.amount)[0] || null;

    // Calculate next player
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Skip players who have already passed or didn't participate in round 1
    while (updatedPlayers[nextPlayerIndex].hasPassedCurrentRound ||
        updatedPlayers[nextPlayerIndex].hasPassedRound1) {
        nextPlayerIndex = (nextPlayerIndex + 1) % players.length;

        // If we've come full circle, break to avoid infinite loop
        if (nextPlayerIndex === currentPlayerIndex) {
            break;
        }
    }

    // Check if bidding round is over (all but one player passed)
    const remainingBidders = updatedPlayers.filter(p => !p.hasPassedCurrentRound && !p.hasPassedRound1);

    let nextPhase: GamePhase = 'bidding2_in_progress';
    if (remainingBidders.length === 1 && newBids.length > 0) {
        // Only one player left, they won the bidding
        nextPhase = 'bidding2_complete';

        // Update trump state with final declarer
        const finalDeclarerId = remainingBidders[0].id;

        // Check if final declarer is the same as provisional bidder
        const sameDeclarers = finalDeclarerId === trumpState.provisionalBidderId;

        return {
            ...gameState,
            players: updatedPlayers,
            bids2: newBids,
            highestBid2: highestBid,
            finalBid: highestBid,
            currentPlayerIndex: updatedPlayers.findIndex(p => p.id === finalDeclarerId),
            currentPhase: nextPhase,
            trumpState: {
                ...gameState.trumpState,
                finalDeclarerId,
                // If same declarer, we can auto-reveal trump
                trumpRevealed: sameDeclarers,
                finalTrumpSuit: sameDeclarers ? gameState.trumpState.provisionalTrumpSuit : undefined,
            },
        };
    }

    return {
        ...gameState,
        players: updatedPlayers,
        bids2: newBids,
        highestBid2: highestBid,
        currentPlayerIndex: nextPlayerIndex,
        currentPhase: nextPhase,
    };
};

/**
 * Select provisional trump by folding a card
 */
export const selectProvisionalTrump = (
    gameState: GameState,
    cardId: string
): GameState => {
    const { players, currentPlayerIndex, trumpState } = gameState;

    if (gameState.currentPhase !== 'bidding1_complete') {
        throw new Error('Not in provisional trump selection phase');
    }

    // Find the card and remove it from player's hand
    const player = players[currentPlayerIndex];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
        throw new Error('Card not found in player hand');
    }

    const card = player.hand[cardIndex];
    const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

    // Update player hand
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
        ...player,
        hand: newHand,
    };

    // Update trump state
    const updatedTrumpState: TrumpState = {
        ...trumpState,
        provisionalTrumpCardId: card.id,
        provisionalTrumpSuit: card.suit,
    };

    // Deal remaining cards (4 more to each player)
    const { hands, remainingDeck } = dealCards(gameState.deck, players.length, 4);

    // Add new cards to player hands
    const playersWithNewCards = updatedPlayers.map((p, i) => ({
        ...p,
        hand: [...p.hand, ...hands[i]],
        // Reset passed status for next bidding round
        hasPassedCurrentRound: false,
    }));

    return {
        ...gameState,
        players: playersWithNewCards,
        deck: remainingDeck,
        foldedCard: card,
        trumpState: updatedTrumpState,
        currentPhase: 'bidding2_start',
        currentPlayerIndex: gameState.originalBidderIndex, // Start again from original bidder
    };
};

/**
 * Finalize trump selection (keep or change)
 */
export const finalizeTrump = (
    gameState: GameState,
    keepProvisional: boolean,
    newTrumpCardId?: string
): GameState => {
    const { players, currentPlayerIndex, trumpState, foldedCard } = gameState;

    if (gameState.currentPhase !== 'bidding2_complete') {
        throw new Error('Not in final trump selection phase');
    }

    if (!trumpState.provisionalTrumpSuit || !foldedCard) {
        throw new Error('No provisional trump to keep or change');
    }

    let updatedTrumpState: TrumpState = { ...trumpState };
    const updatedPlayers = [...players];
    const player = players[currentPlayerIndex];

    if (keepProvisional) {
        // Keep the provisional trump
        updatedTrumpState = {
            ...updatedTrumpState,
            finalTrumpSuit: trumpState.provisionalTrumpSuit,
            finalTrumpCardId: trumpState.provisionalTrumpCardId,
            trumpRevealed: true,
            declarerChoseKeep: true,
        };
    } else {
        // Change to a new trump by folding a different card
        if (!newTrumpCardId) {
            throw new Error('Must provide new trump card ID when changing trump');
        }

        // Find the new card to fold
        const cardIndex = player.hand.findIndex(c => c.id === newTrumpCardId);
        if (cardIndex === -1) {
            throw new Error('New trump card not found in player hand');
        }

        const newTrumpCard = player.hand[cardIndex];
        const newHand = [
            ...player.hand.slice(0, cardIndex),
            ...player.hand.slice(cardIndex + 1),
            foldedCard, // Return the previously folded card to hand
        ];

        // Update player hand
        updatedPlayers[currentPlayerIndex] = {
            ...player,
            hand: newHand,
        };

        // Update trump state
        updatedTrumpState = {
            ...updatedTrumpState,
            finalTrumpSuit: newTrumpCard.suit,
            finalTrumpCardId: newTrumpCardId,
            trumpRevealed: true,
            declarerChoseNew: true,
            foldedCardReturned: true,
        };
    }

    // Start the game with the player to the left of the dealer
    const firstPlayerIndex = (gameState.dealerIndex + 1) % players.length;

    return {
        ...gameState,
        players: updatedPlayers,
        trumpState: updatedTrumpState,
        currentPhase: 'playing_start_trick',
        currentPlayerIndex: firstPlayerIndex,
        currentTrick: {
            cards: [],
            playedBy: [],
            leaderId: players[firstPlayerIndex].id,
            leadSuit: 'Hearts', // Temporary value, will be updated when first card is played
            timestamp: Date.now(),
            points: 0,
        },
    };
};

/**
 * Play a card during a trick
 */
export const playCard = (
    gameState: GameState,
    playerId: string,
    cardId: string
): GameState => {
    const { players, currentPlayerIndex, currentTrick, trumpState } = gameState;

    if (gameState.currentPhase !== 'playing_start_trick' &&
        gameState.currentPhase !== 'playing_in_progress') {
        throw new Error('Not in card playing phase');
    }

    if (!currentTrick) {
        throw new Error('No active trick');
    }

    // Validate that it's the player's turn
    if (players[currentPlayerIndex].id !== playerId) {
        throw new Error('Not your turn to play');
    }

    // Find the card in the player's hand
    const player = players[currentPlayerIndex];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
        throw new Error('Card not found in player hand');
    }

    const card = player.hand[cardIndex];

    // Validate the play
    if (currentTrick.cards.length > 0) {
        // Not the first card of the trick, validate against rules
        const isValid = validatePlay(
            card,
            playerId,
            player.hand,
            currentTrick,
            trumpState,
            trumpState.finalDeclarerId
        );

        if (!isValid) {
            throw new Error('Invalid card play');
        }
    }

    // Remove card from player's hand
    const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];

    // Update player hand
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = {
        ...player,
        hand: newHand,
    };

    // Update current trick
    let updatedTrick = { ...currentTrick };

    // If this is the first card, set the lead suit
    if (currentTrick.cards.length === 0) {
        updatedTrick.leadSuit = card.suit;
    }

    // Add the card to the trick
    updatedTrick = {
        ...updatedTrick,
        cards: [...updatedTrick.cards, card],
        playedBy: [...updatedTrick.playedBy, playerId],
    };

    // Calculate next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Check if trick is complete
    if (updatedTrick.cards.length === players.length) {
        // Trick is complete
        return completeTrick(gameState, updatedPlayers, updatedTrick);
    }

    // Trick continues
    return {
        ...gameState,
        players: updatedPlayers,
        currentTrick: updatedTrick,
        currentPlayerIndex: nextPlayerIndex,
        currentPhase: 'playing_in_progress',
    };
};

/**
 * Complete a trick and update game state
 */
const completeTrick = (
    gameState: GameState,
    updatedPlayers: Player[],
    completedTrick: Trick
): GameState => {
    const { trumpState } = gameState;

    // Determine the winner of the trick
    const winnerIndex = determineTrickWinner(completedTrick, trumpState);
    const winnerPlayerId = completedTrick.playedBy[winnerIndex];
    const winnerPlayerIndex = updatedPlayers.findIndex(p => p.id === winnerPlayerId);

    // Calculate points in the trick
    const trickPoints = calculateCardPoints(completedTrick.cards);

    // Add the completed trick to the winner's tricks
    const winnerPlayer = updatedPlayers[winnerPlayerIndex];
    const updatedWinnerPlayer = {
        ...winnerPlayer,
        tricksWon: [...winnerPlayer.tricksWon, { ...completedTrick, winnerId: winnerPlayerId, points: trickPoints }],
    };

    const finalPlayers = [...updatedPlayers];
    finalPlayers[winnerPlayerIndex] = updatedWinnerPlayer;

    // Check if all cards have been played
    const allCardsPlayed = finalPlayers.every(p => p.hand.length === 0);

    if (allCardsPlayed) {
        // Round is complete
        return {
            ...gameState,
            players: finalPlayers,
            currentTrick: null,
            completedTricks: [...gameState.completedTricks, { ...completedTrick, winnerId: winnerPlayerId, points: trickPoints }],
            currentPhase: 'round_over',
        };
    }

    // Start a new trick with the winner as leader
    return {
        ...gameState,
        players: finalPlayers,
        currentTrick: {
            cards: [],
            playedBy: [],
            leaderId: winnerPlayerId,
            leadSuit: 'Hearts', // Temporary value, will be updated when first card is played
            timestamp: Date.now(),
            points: 0,
        },
        completedTricks: [...gameState.completedTricks, { ...completedTrick, winnerId: winnerPlayerId, points: trickPoints }],
        currentPlayerIndex: winnerPlayerIndex,
        currentPhase: 'playing_start_trick',
    };
}; 