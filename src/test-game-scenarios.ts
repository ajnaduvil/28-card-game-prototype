import { 
  initializeGame,
  dealInitialCards,
  playCard
} from './services/local/gameEngine';
import { GameState, Trick, TrumpState, GamePhase } from './models/game';
import { Card, Suit } from './models/card';

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

// Helper function to create a predefined game state for testing
function createTestGameState(): GameState {
  // Create a basic game state with 3 players
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  
  // Set up specific cards for each player for deterministic testing
  const player1Cards: Card[] = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
    { id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 },
    { id: 'HK', suit: 'Hearts', rank: 'K', pointValue: 0, order: 4 }
  ];
  
  const player2Cards: Card[] = [
    { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 },
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'SA', suit: 'Spades', rank: 'A', pointValue: 1, order: 6 },
    { id: 'SK', suit: 'Spades', rank: 'K', pointValue: 0, order: 4 }
  ];
  
  const player3Cards: Card[] = [
    { id: 'DJ', suit: 'Diamonds', rank: 'J', pointValue: 3, order: 8 },
    { id: 'D9', suit: 'Diamonds', rank: '9', pointValue: 2, order: 7 },
    { id: 'DA', suit: 'Diamonds', rank: 'A', pointValue: 1, order: 6 },
    { id: 'DK', suit: 'Diamonds', rank: 'K', pointValue: 0, order: 4 }
  ];
  
  // Assign cards to players
  gameState.players[0].hand = player1Cards;
  gameState.players[1].hand = player2Cards;
  gameState.players[2].hand = player3Cards;
  
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

// Test a complete trick scenario
runTest('Complete Trick Scenario', () => {
  totalTests++;
  // Set up the test game state
  let gameState = createTestGameState();
  
  console.log("Initial state:");
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Trump suit: ${gameState.trumpState.finalTrumpSuit}`);
  
  // Player 1 plays a Heart
  const player1 = gameState.players[0];
  const player1Card = player1.hand[0]; // HJ
  console.log(`\n${player1.name} plays ${player1Card.rank} of ${player1Card.suit}`);
  
  gameState = playCard(gameState, player1.id, player1Card.id);
  
  console.log(`  Current trick cards: ${gameState.currentTrick?.cards.map(c => c.id).join(', ')}`);
  console.log(`  Lead suit: ${gameState.currentTrick?.leadSuit}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  
  // Player 2 plays a Spade (trump)
  const player2 = gameState.players[1];
  const player2Card = player2.hand[0]; // SJ
  console.log(`\n${player2.name} plays ${player2Card.rank} of ${player2Card.suit} (trump)`);
  
  gameState = playCard(gameState, player2.id, player2Card.id);
  
  console.log(`  Current trick cards: ${gameState.currentTrick?.cards.map(c => c.id).join(', ')}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  
  // Player 3 plays a Diamond (can't follow suit)
  const player3 = gameState.players[2];
  const player3Card = player3.hand[0]; // DJ
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
  console.assert(completedTrick.points === 6, `Expected 6 points, but got ${completedTrick.points}`);
  
  // Verify the trick is in the winner's tricksWon array
  const winner = gameState.players.find(p => p.id === winnerId);
  console.assert(winner?.tricksWon.length === 1, `Expected winner to have 1 trick, but has ${winner?.tricksWon.length}`);
  
  // Verify next trick is set up with winner as leader
  console.assert(gameState.currentPhase === 'playing_start_trick', 
    `Expected phase to be playing_start_trick, but is ${gameState.currentPhase}`);
  console.assert(gameState.currentPlayerIndex === 1, 
    `Expected current player to be Player 2 (index 1), but is ${gameState.currentPlayerIndex}`);
    
  passedTests++;
});

// Test bidding scenario
runTest('Bidding Scenario', () => {
  totalTests++;
  // Create a basic game state with 3 players
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  gameState = dealInitialCards(gameState);
  
  console.log("Initial bidding state:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Current player: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Player hands: ${gameState.players.map(p => p.hand.length)} cards each`);
  
  // Verify we're in the bidding phase
  console.assert(gameState.currentPhase === 'bidding1_start', 
    `Expected phase to be bidding1_start, but is ${gameState.currentPhase}`);
  console.assert(gameState.currentPlayerIndex === 1, 
    `Expected current player to be Player 2 (index 1), but is ${gameState.currentPlayerIndex}`);
  
  // Verify each player has 4 cards
  gameState.players.forEach((player, index) => {
    console.assert(player.hand.length === 4, 
      `Expected Player ${index + 1} to have 4 cards, but has ${player.hand.length}`);
  });
  
  passedTests++;
});

// Test trump selection scenario
runTest('Trump Selection Scenario', () => {
  totalTests++;
  // Create a game state that's ready for trump selection
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');
  
  // Set up specific cards for the declarer
  const declarerCards: Card[] = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 },
    { id: 'DJ', suit: 'Diamonds', rank: 'J', pointValue: 3, order: 8 },
    { id: 'CJ', suit: 'Clubs', rank: 'J', pointValue: 3, order: 8 }
  ];
  
  // Assign cards to declarer
  gameState.players[1].hand = declarerCards;
  
  // Set up for provisional trump selection
  gameState.currentPhase = 'bidding1_complete';
  gameState.currentPlayerIndex = 1; // Player 2 is declarer
  gameState.trumpState.provisionalBidderId = gameState.players[1].id;
  
  console.log("Trump selection state:");
  console.log(`  Current phase: ${gameState.currentPhase}`);
  console.log(`  Declarer: ${gameState.players[gameState.currentPlayerIndex].name}`);
  console.log(`  Declarer hand: ${gameState.players[1].hand.map(c => c.id).join(', ')}`);
  
  // Verify we're in the right phase
  console.assert(gameState.currentPhase === 'bidding1_complete', 
    `Expected phase to be bidding1_complete, but is ${gameState.currentPhase}`);
  console.assert(gameState.currentPlayerIndex === 1, 
    `Expected current player to be Player 2 (index 1), but is ${gameState.currentPlayerIndex}`);
  
  passedTests++;
});

// Print summary
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🎉 All game scenario tests passed!');
} else {
  console.log(`\n❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
