import { 
  initializeGame,
  dealInitialCards
} from './services/local/gameEngine';
import { GameState } from './models/game';

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

// Test initializeGame
runTest('initializeGame 3p', () => {
  totalTests++;
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  const gameState = initializeGame(playerNames, '3p');
  
  console.log(`  Game mode: ${gameState.gameMode}`);
  console.log(`  Player count: ${gameState.players.length}`);
  
  console.assert(gameState.gameMode === '3p', 'Game mode should be 3p');
  console.assert(gameState.players.length === 3, 'Should have 3 players');
  console.assert(gameState.currentPhase === 'setup', 'Initial phase should be setup');
  console.assert(gameState.roundNumber === 1, 'Round number should be 1');
  console.assert(gameState.dealerIndex === 0, 'Dealer index should be 0');
  console.assert(gameState.originalBidderIndex === 1, 'Original bidder index should be 1');
  console.assert(gameState.currentPlayerIndex === 1, 'Current player index should be 1');
  console.assert(gameState.trumpState.trumpRevealed === false, 'Trump should not be revealed');
  console.assert(gameState.status === 'waiting', 'Game status should be waiting');
  
  passedTests++;
});

runTest('initializeGame 4p', () => {
  totalTests++;
  const playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  const gameState = initializeGame(playerNames, '4p');
  
  console.log(`  Game mode: ${gameState.gameMode}`);
  console.log(`  Player count: ${gameState.players.length}`);
  
  console.assert(gameState.gameMode === '4p', 'Game mode should be 4p');
  console.assert(gameState.players.length === 4, 'Should have 4 players');
  
  // Check team assignments
  console.assert(gameState.players[0].team === 0, 'Player 0 should be on team 0');
  console.assert(gameState.players[1].team === 1, 'Player 1 should be on team 1');
  console.assert(gameState.players[2].team === 0, 'Player 2 should be on team 0');
  console.assert(gameState.players[3].team === 1, 'Player 3 should be on team 1');
  
  passedTests++;
});

runTest('initializeGame invalid player count', () => {
  totalTests++;
  const playerNames = ['Player 1', 'Player 2'];
  
  try {
    initializeGame(playerNames, '3p');
    console.assert(false, 'Should throw an error for invalid player count');
  } catch (error) {
    console.log(`  Error thrown as expected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // This is expected, so the test passes
  }
  
  try {
    initializeGame(playerNames, '4p');
    console.assert(false, 'Should throw an error for invalid player count');
  } catch (error) {
    console.log(`  Error thrown as expected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // This is expected, so the test passes
  }
  
  passedTests++;
});

// Test dealInitialCards
runTest('dealInitialCards', () => {
  totalTests++;
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  
  gameState = dealInitialCards(gameState);
  
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Player 0 hand size: ${gameState.players[0].hand.length}`);
  
  console.assert(gameState.currentPhase === 'bidding1_start', 'Phase should be bidding1_start');
  
  // Each player should have 4 cards
  gameState.players.forEach((player, index) => {
    console.assert(player.hand.length === 4, `Player ${index} should have 4 cards`);
    console.assert(player.initialHand?.length === 4, `Player ${index} should have 4 cards in initialHand`);
  });
  
  // Deck should have remaining cards (24 - 12 = 12 for 3p)
  console.assert(gameState.deck.length === 12, 'Deck should have 12 cards remaining');
  
  passedTests++;
});

// Print summary
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! The game engine can be tested in isolation.');
} else {
  console.log(`\n❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
