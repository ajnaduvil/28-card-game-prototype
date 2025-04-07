import { 
  initializeGame,
  playCard,
  confirmTrick
} from './services/local/gameEngine';
import { GameState } from './models/game';
import { Card } from './models/card';

// Create a test game state with a completed trick
function createTestGameState(): GameState {
  // Create a basic game state with 3 players
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  
  // Set up specific cards for each player
  gameState.players[0].hand = [
    { id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 }
  ];
  
  gameState.players[1].hand = [
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 }
  ];
  
  gameState.players[2].hand = [
    { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }
  ];
  
  // Set up trump state
  gameState.trumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades',
    finalDeclarerId: gameState.players[1].id
  };
  
  // Set up current trick
  gameState.currentTrick = {
    cards: [],
    playedBy: [],
    leaderId: gameState.players[0].id,
    leadSuit: 'Hearts', // Will be set when first card is played
    timestamp: Date.now(),
    points: 0
  };
  
  // Set current phase to playing
  gameState.currentPhase = 'playing_start_trick';
  gameState.currentPlayerIndex = 0; // Player 1 starts
  
  return gameState;
}

// Run the test
function runTest() {
  console.log("Starting trick confirmation test...");
  
  // Create the test game state
  let gameState = createTestGameState();
  
  console.log("Initial state:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  
  // Play cards to complete the trick
  console.log("\nPlaying cards to complete the trick...");
  
  // Player 1 plays a Heart
  gameState = playCard(gameState, gameState.players[0].id, 'HA');
  console.log(`  Player 1 played HA`);
  console.log(`  Current phase: ${gameState.currentPhase}`);
  
  // Player 2 plays a Spade (trump)
  gameState = playCard(gameState, gameState.players[1].id, 'S9');
  console.log(`  Player 2 played S9`);
  console.log(`  Current phase: ${gameState.currentPhase}`);
  
  // Player 3 plays a Heart
  gameState = playCard(gameState, gameState.players[2].id, 'H9');
  console.log(`  Player 3 played H9`);
  console.log(`  Current phase: ${gameState.currentPhase}`);
  
  // At this point, the trick should be complete and awaiting confirmation
  console.log("\nTrick completed:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Completed trick awaiting confirmation: ${gameState.completedTrickAwaitingConfirmation ? 'Yes' : 'No'}`);
  
  if (gameState.completedTrickAwaitingConfirmation) {
    console.log(`  Winner: ${gameState.players.find(p => p.id === gameState.completedTrickAwaitingConfirmation?.winnerId)?.name}`);
    console.log(`  Points: ${gameState.completedTrickAwaitingConfirmation.points}`);
  }
  
  // Confirm the trick
  console.log("\nConfirming the trick...");
  gameState = confirmTrick(gameState);
  
  console.log("\nAfter confirmation:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Completed tricks: ${gameState.completedTricks.length}`);
  console.log(`  Current trick: ${gameState.currentTrick ? 'Exists' : 'Null'}`);
  
  if (gameState.completedTricks.length > 0) {
    const lastTrick = gameState.completedTricks[gameState.completedTricks.length - 1];
    console.log(`  Last completed trick winner: ${gameState.players.find(p => p.id === lastTrick.winnerId)?.name}`);
  }
  
  console.log("\nTest completed!");
}

// Run the test
runTest();
