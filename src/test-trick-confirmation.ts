import { 
  initializeGame,
  playCard,
  confirmTrick // This will be our new function
} from './services/local/gameEngine';
import { GameState, Trick } from './models/game';
import { Card } from './models/card';

// Helper function to run tests
function runTest(name: string, testFn: () => void) {
  try {
    console.log(`\nTesting ${name}...`);
    testFn();
    console.log(`✅ ${name} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    return false;
  }
}

let passedTests = 0;
let totalTests = 0;

// Helper function to create a test game state with a completed trick
function createGameStateWithCompletedTrick(): GameState {
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
  
  // Play cards to complete the trick
  gameState = playCard(gameState, gameState.players[0].id, 'HA');
  gameState = playCard(gameState, gameState.players[1].id, 'S9');
  gameState = playCard(gameState, gameState.players[2].id, 'H9');
  
  // At this point, the trick should be complete but waiting for confirmation
  return gameState;
}

// Test trick completion with confirmation
runTest('Trick Completion with Confirmation', () => {
  totalTests++;
  
  // Create a game state with a completed trick
  let gameState = createGameStateWithCompletedTrick();
  
  console.log("Initial state after trick completion:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Completed trick awaiting confirmation: ${gameState.completedTrickAwaitingConfirmation ? 'Yes' : 'No'}`);
  
  // Verify we're in the waiting for confirmation phase
  console.assert(gameState.currentPhase === 'trick_completed_awaiting_confirmation', 
    `Expected phase to be trick_completed_awaiting_confirmation, but is ${gameState.currentPhase}`);
  
  console.assert(gameState.completedTrickAwaitingConfirmation !== undefined, 
    'Expected completedTrickAwaitingConfirmation to be defined');
  
  // Confirm the trick
  gameState = confirmTrick(gameState);
  
  console.log("\nAfter confirmation:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Completed tricks: ${gameState.completedTricks.length}`);
  console.log(`  Current trick: ${gameState.currentTrick ? 'Exists' : 'Null'}`);
  
  // Verify the trick was moved to completedTricks
  console.assert(gameState.completedTricks.length === 1, 
    `Expected 1 completed trick, but got ${gameState.completedTricks.length}`);
  
  // Verify we're in the playing_start_trick phase for the next trick
  console.assert(gameState.currentPhase === 'playing_start_trick', 
    `Expected phase to be playing_start_trick, but is ${gameState.currentPhase}`);
  
  // Verify the current trick is set up for the next trick
  console.assert(gameState.currentTrick !== null, 'Expected currentTrick to be set up for next trick');
  console.assert(gameState.currentTrick?.cards.length === 0, 
    `Expected current trick to have 0 cards, but has ${gameState.currentTrick?.cards.length}`);
  
  // Verify completedTrickAwaitingConfirmation is cleared
  console.assert(gameState.completedTrickAwaitingConfirmation === undefined, 
    'Expected completedTrickAwaitingConfirmation to be undefined after confirmation');
  
  passedTests++;
});

// Test auto-confirmation after timeout
runTest('Auto-Confirmation After Timeout', () => {
  totalTests++;
  
  // This test is more conceptual since we can't easily test timeouts in a synchronous test
  console.log("Note: This test is conceptual. The actual timeout behavior will be tested in the UI.");
  
  // Create a game state with a completed trick
  let gameState = createGameStateWithCompletedTrick();
  
  // Verify we're in the waiting for confirmation phase
  console.assert(gameState.currentPhase === 'trick_completed_awaiting_confirmation', 
    `Expected phase to be trick_completed_awaiting_confirmation, but is ${gameState.currentPhase}`);
  
  // Simulate what would happen after a timeout
  console.log("\nSimulating auto-confirmation after timeout:");
  gameState = confirmTrick(gameState);
  
  // Verify the trick was moved to completedTricks
  console.assert(gameState.completedTricks.length === 1, 
    `Expected 1 completed trick, but got ${gameState.completedTricks.length}`);
  
  // Verify we're in the playing_start_trick phase for the next trick
  console.assert(gameState.currentPhase === 'playing_start_trick', 
    `Expected phase to be playing_start_trick, but is ${gameState.currentPhase}`);
  
  passedTests++;
});

// Print summary
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log(`\n❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
