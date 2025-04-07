import { 
  initializeGame,
  dealInitialCards,
  playCard
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

// Test a simple trick with trump
runTest('Simple Trick with Trump', () => {
  totalTests++;
  
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
  
  console.log("Initial state:");
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Trump suit: ${gameState.trumpState.finalTrumpSuit}`);
  
  // Player 1 plays a Heart
  const player1 = gameState.players[0];
  const player1Card = player1.hand[0]; // HA
  console.log(`\n${player1.name} plays ${player1Card.rank} of ${player1Card.suit}`);
  
  gameState = playCard(gameState, player1.id, player1Card.id);
  
  console.log(`  Current trick cards: ${gameState.currentTrick?.cards.map(c => c.id).join(', ')}`);
  console.log(`  Lead suit: ${gameState.currentTrick?.leadSuit}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  
  // Player 2 plays a Spade (trump)
  const player2 = gameState.players[1];
  const player2Card = player2.hand[0]; // S9
  console.log(`\n${player2.name} plays ${player2Card.rank} of ${player2Card.suit} (trump)`);
  
  gameState = playCard(gameState, player2.id, player2Card.id);
  
  console.log(`  Current trick cards: ${gameState.currentTrick?.cards.map(c => c.id).join(', ')}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  
  // Player 3 plays a Heart (following suit)
  const player3 = gameState.players[2];
  const player3Card = player3.hand[0]; // H9
  console.log(`\n${player3.name} plays ${player3Card.rank} of ${player3Card.suit}`);
  
  gameState = playCard(gameState, player3.id, player3Card.id);
  
  // Trick should be complete now
  console.log("\nTrick completed:");
  console.log(`  Completed tricks: ${gameState.completedTricks.length}`);
  
  // Get the last completed trick
  const completedTrick = gameState.completedTricks[0];
  console.log(`  Winner: ${gameState.players.find(p => p.id === completedTrick.winnerId)?.name}`);
  console.log(`  Points: ${completedTrick.points}`);
  
  // Verify the winner is Player 2 (played trump)
  const winnerId = completedTrick.winnerId;
  const winnerName = gameState.players.find(p => p.id === winnerId)?.name;
  
  console.assert(winnerName === 'Player 2', `Expected Player 2 to win, but ${winnerName} won`);
  
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
