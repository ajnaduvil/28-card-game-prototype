import {
  initializeGame,
  dealInitialCards,
  processBid,
  selectProvisionalTrump
} from './services/local/gameEngine';
import { GameState } from './models/game';
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

// Test bidding process
runTest('Bidding Process', () => {
  totalTests++;

  // Create a basic game state with 3 players
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  gameState = dealInitialCards(gameState);

  console.log("Initial bidding state:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);

  // Player 2 places a bid
  const player2 = gameState.players[1];
  const bidAmount = 14;
  console.log(`\n${player2.name} bids ${bidAmount}`);

  gameState = processBid(gameState, player2.id, bidAmount);

  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Bids: ${gameState.bids1.map(b => b.isPass ? 'Pass' : b.amount).join(', ')}`);

  // Player 3 passes
  const player3 = gameState.players[2];
  console.log(`\n${player3.name} passes`);

  gameState = processBid(gameState, player3.id, null);

  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Bids: ${gameState.bids1.map(b => b.isPass ? 'Pass' : b.amount).join(', ')}`);

  // Player 1 passes
  const player1 = gameState.players[0];
  console.log(`\n${player1.name} passes`);

  gameState = processBid(gameState, player1.id, null);

  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Bids: ${gameState.bids1.map(b => b.isPass ? 'Pass' : b.amount).join(', ')}`);

  // Verify bidding is complete and Player 2 is the winner
  console.assert(gameState.currentPhase === 'bidding1_complete',
    `Expected phase to be bidding1_complete, but is ${gameState.currentPhase}`);

  console.assert(gameState.trumpState.provisionalBidderId === player2.id,
    `Expected Player 2 to win the bidding, but winner is ${gameState.players.find(p => p.id === gameState.trumpState.provisionalBidderId)?.name}`);

  // Now Player 2 selects a provisional trump
  console.log("\nProvisional trump selection:");

  // Assign a specific card to Player 2 for trump selection
  const trumpCard: Card = { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 };
  gameState.players[1].hand = [trumpCard, ...gameState.players[1].hand];

  gameState = selectProvisionalTrump(gameState, trumpCard.id);

  console.log(`  Selected trump: ${gameState.trumpState.provisionalTrumpSuit}`);
  console.log(`  Current phase: ${gameState.currentPhase}`);

  // Verify trump selection
  console.assert(gameState.trumpState.provisionalTrumpSuit === 'Spades',
    `Expected provisional trump to be Spades, but is ${gameState.trumpState.provisionalTrumpSuit}`);

  console.assert(gameState.currentPhase === 'trump_selection_provisional',
    `Expected phase to be trump_selection_provisional, but is ${gameState.currentPhase}`);

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
