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

// Test following suit rule
runTest('Following Suit Rule', () => {
  totalTests++;

  // Create a game state with specific cards
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');

  // Player 1 has Hearts and Spades
  gameState.players[0].hand = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'SK', suit: 'Spades', rank: 'K', pointValue: 0, order: 4 }
  ];

  // Set up trump state
  gameState.trumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades',
    finalDeclarerId: gameState.players[1].id
  };

  // Set up a trick where Hearts is led
  gameState.currentTrick = {
    cards: [{ id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 }],
    playedBy: [gameState.players[2].id],
    leaderId: gameState.players[2].id,
    leadSuit: 'Hearts',
    timestamp: Date.now(),
    points: 1
  };

  gameState.currentPhase = 'playing_in_progress';
  gameState.currentPlayerIndex = 0; // Player 1's turn

  console.log("Testing following suit rule:");
  console.log(`  Lead suit: ${gameState.currentTrick.leadSuit}`);
  console.log(`  Player 1 hand: ${gameState.players[0].hand.map(c => `${c.rank} of ${c.suit}`).join(', ')}`);

  // Try to play a Spade (should fail because player has Hearts)
  const spadeCard = gameState.players[0].hand.find(c => c.suit === 'Spades');

  try {
    // This should fail because player must follow suit
    gameState = playCard(gameState, gameState.players[0].id, spadeCard!.id);
    console.assert(false, "Should not be able to play a Spade when Hearts is led and player has Hearts");
  } catch (error) {
    console.log(`  ✓ Correctly prevented playing Spade when Hearts is led`);
  }

  // Now play a Heart (should succeed)
  const heartCard = gameState.players[0].hand.find(c => c.suit === 'Hearts');
  gameState = playCard(gameState, gameState.players[0].id, heartCard!.id);

  console.log(`  ✓ Successfully played ${heartCard!.rank} of ${heartCard!.suit}`);
  console.log(`  Current trick cards: ${gameState.currentTrick?.cards.map(c => c.id).join(', ')}`);

  // Verify the card was added to the trick
  console.assert(gameState.currentTrick?.cards.length === 2,
    `Expected 2 cards in trick, but got ${gameState.currentTrick?.cards.length}`);

  passedTests++;
});

// Test trump card winning
runTest('Trump Card Winning', () => {
  totalTests++;

  // Create a game state with a trick in progress
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');

  // Set up trump state
  gameState.trumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades',
    finalDeclarerId: gameState.players[1].id
  };

  // Player 1 led with Hearts
  gameState.players[0].hand = [
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'SK', suit: 'Spades', rank: 'K', pointValue: 0, order: 4 }
  ];

  // Player 2 has a low trump
  gameState.players[1].hand = [
    { id: 'S7', suit: 'Spades', rank: '7', pointValue: 0, order: 1 },
    { id: 'D9', suit: 'Diamonds', rank: '9', pointValue: 2, order: 7 }
  ];

  // Player 3 has a high heart
  gameState.players[2].hand = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'DK', suit: 'Diamonds', rank: 'K', pointValue: 0, order: 4 }
  ];

  // Set up a trick where Hearts is led by Player 1
  gameState.currentTrick = {
    cards: [{ id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 }],
    playedBy: [gameState.players[0].id],
    leaderId: gameState.players[0].id,
    leadSuit: 'Hearts',
    timestamp: Date.now(),
    points: 1
  };

  gameState.currentPhase = 'playing_in_progress';
  gameState.currentPlayerIndex = 1; // Player 2's turn

  console.log("Testing trump card winning:");
  console.log(`  Lead suit: ${gameState.currentTrick.leadSuit}`);
  console.log(`  Trump suit: ${gameState.trumpState.finalTrumpSuit}`);

  // Player 2 plays a trump (can't follow suit)
  const trumpCard = gameState.players[1].hand.find(c => c.suit === 'Spades');
  gameState = playCard(gameState, gameState.players[1].id, trumpCard!.id);

  console.log(`  Player 2 plays ${trumpCard!.rank} of ${trumpCard!.suit} (trump)`);

  // Player 3 plays a high heart (following suit)
  const heartCard = gameState.players[2].hand.find(c => c.suit === 'Hearts');
  gameState = playCard(gameState, gameState.players[2].id, heartCard!.id);

  console.log(`  Player 3 plays ${heartCard!.rank} of ${heartCard!.suit} (high card of lead suit)`);

  // Trick should be complete now
  console.log("\nTrick completed:");
  console.log(`  Cards played: ${gameState.completedTricks[0].cards.map(c => `${c.rank} of ${c.suit}`).join(', ')}`);

  // Get the winner
  const winnerId = gameState.completedTricks[0].winnerId;
  const winnerName = gameState.players.find(p => p.id === winnerId)?.name;

  console.log(`  Winner: ${winnerName}`);

  // Verify Player 2 won with the trump card
  console.assert(winnerName === 'Player 2',
    `Expected Player 2 to win with trump, but ${winnerName} won`);

  passedTests++;
});

// Test highest trump winning
runTest('Highest Trump Winning', () => {
  totalTests++;

  // Create a game state with specific cards
  const playerNames = ['Player 1', 'Player 2', 'Player 3'];
  let gameState = initializeGame(playerNames, '3p');

  // Set up trump state
  gameState.trumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades',
    finalDeclarerId: gameState.players[1].id
  };

  // Set up player hands with specific cards
  // Player 1 has Hearts and Diamonds
  gameState.players[0].hand = [
    { id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 },
    { id: 'D9', suit: 'Diamonds', rank: '9', pointValue: 2, order: 7 }
  ];

  // Player 2 has a high trump
  gameState.players[1].hand = [
    { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 },
    { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }
  ];

  // Player 3 has a medium trump
  gameState.players[2].hand = [
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'H7', suit: 'Hearts', rank: '7', pointValue: 0, order: 1 }
  ];

  // Set up a trick where Hearts is led
  gameState.currentTrick = {
    cards: [],
    playedBy: [],
    leaderId: gameState.players[0].id,
    leadSuit: 'Hearts', // Will be set when first card is played
    timestamp: Date.now(),
    points: 0
  };

  gameState.currentPhase = 'playing_start_trick';
  gameState.currentPlayerIndex = 0; // Player 1's turn

  console.log("Testing highest trump winning:");

  // Player 1 leads with Hearts
  const heartCard = gameState.players[0].hand.find(c => c.suit === 'Hearts');
  gameState = playCard(gameState, gameState.players[0].id, heartCard!.id);

  console.log(`  Player 1 leads with ${heartCard!.rank} of ${heartCard!.suit}`);
  console.log(`  Lead suit: ${gameState.currentTrick!.leadSuit}`);

  // Player 2 plays a high trump (can't follow suit)
  const highTrumpCard = gameState.players[1].hand.find(c => c.suit === 'Spades');
  gameState = playCard(gameState, gameState.players[1].id, highTrumpCard!.id);

  console.log(`  Player 2 plays ${highTrumpCard!.rank} of ${highTrumpCard!.suit} (high trump)`);

  // Player 3 plays a medium trump (can't follow suit)
  const mediumTrumpCard = gameState.players[2].hand.find(c => c.suit === 'Spades');
  gameState = playCard(gameState, gameState.players[2].id, mediumTrumpCard!.id);

  console.log(`  Player 3 plays ${mediumTrumpCard!.rank} of ${mediumTrumpCard!.suit} (medium trump)`);

  // Trick should be complete now
  console.log("\nTrick completed:");
  console.log(`  Cards played: ${gameState.completedTricks[0].cards.map(c => `${c.rank} of ${c.suit}`).join(', ')}`);

  // Get the winner
  const winnerId = gameState.completedTricks[0].winnerId;
  const winnerName = gameState.players.find(p => p.id === winnerId)?.name;

  console.log(`  Winner: ${winnerName}`);

  // Verify Player 2 won with the highest trump card
  console.assert(winnerName === 'Player 2',
    `Expected Player 2 to win with highest trump, but ${winnerName} won`);

  passedTests++;
});

// Print summary
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🎉 All advanced game scenario tests passed!');
} else {
  console.log(`\n❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
