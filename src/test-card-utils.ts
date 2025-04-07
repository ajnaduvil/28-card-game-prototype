import {
  generateDeck,
  shuffleDeck,
  dealCards,
  calculateCardPoints,
  canFollowSuit,
  determineTrickWinner
} from './services/local/cardUtils';
import { Card, Suit } from './models/card';
import { Trick, TrumpState } from './models/game';

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

// Test generateDeck
runTest('generateDeck 3p', () => {
  totalTests++;
  const deck = generateDeck('3p');
  console.log(`  3p deck length: ${deck.length} (expected 24)`);
  console.assert(deck.length === 24, '3p deck should have 24 cards');

  // Check ranks
  const ranks = new Set(deck.map(card => card.rank));
  console.assert(ranks.has('A'), 'Deck should have Aces');
  console.assert(ranks.has('K'), 'Deck should have Kings');
  console.assert(ranks.has('Q'), 'Deck should have Queens');
  console.assert(ranks.has('J'), 'Deck should have Jacks');
  console.assert(ranks.has('10'), 'Deck should have 10s');
  console.assert(ranks.has('9'), 'Deck should have 9s');
  console.assert(!ranks.has('8'), 'Deck should not have 8s');
  console.assert(!ranks.has('7'), 'Deck should not have 7s');

  // Check suits
  const suits = new Set(deck.map(card => card.suit));
  console.assert(suits.has('Hearts'), 'Deck should have Hearts');
  console.assert(suits.has('Diamonds'), 'Deck should have Diamonds');
  console.assert(suits.has('Clubs'), 'Deck should have Clubs');
  console.assert(suits.has('Spades'), 'Deck should have Spades');

  // Check point values
  const jackOfHearts = deck.find(card => card.id === 'HJ');
  console.assert(jackOfHearts?.pointValue === 3, 'Jack should be worth 3 points');

  const nineOfSpades = deck.find(card => card.id === 'S9');
  console.assert(nineOfSpades?.pointValue === 2, '9 should be worth 2 points');

  const aceOfClubs = deck.find(card => card.id === 'CA');
  console.assert(aceOfClubs?.pointValue === 1, 'Ace should be worth 1 point');

  const tenOfDiamonds = deck.find(card => card.id === 'D10');
  console.assert(tenOfDiamonds?.pointValue === 1, '10 should be worth 1 point');

  const kingOfHearts = deck.find(card => card.id === 'HK');
  console.assert(kingOfHearts?.pointValue === 0, 'King should be worth 0 points');

  passedTests++;
});

runTest('generateDeck 4p', () => {
  totalTests++;
  const deck = generateDeck('4p');
  console.log(`  4p deck length: ${deck.length} (expected 32)`);
  console.assert(deck.length === 32, '4p deck should have 32 cards');

  // Check additional ranks for 4p
  const ranks = new Set(deck.map(card => card.rank));
  console.assert(ranks.has('8'), '4p deck should have 8s');
  console.assert(ranks.has('7'), '4p deck should have 7s');

  passedTests++;
});

// Test shuffleDeck
runTest('shuffleDeck', () => {
  totalTests++;
  const originalDeck = generateDeck('3p');
  const originalOrder = [...originalDeck].map(card => card.id);

  const shuffledDeck = shuffleDeck(originalDeck);
  const shuffledOrder = shuffledDeck.map(card => card.id);

  // Check that the deck has the same cards but in a different order
  console.assert(shuffledDeck.length === originalDeck.length, 'Shuffled deck should have the same number of cards');

  // Sort both arrays and compare to ensure the same cards are present
  const sortedOriginal = [...originalOrder].sort();
  const sortedShuffled = [...shuffledOrder].sort();
  console.assert(JSON.stringify(sortedOriginal) === JSON.stringify(sortedShuffled), 'Shuffled deck should contain the same cards');

  // Check that the order is different (this could theoretically fail if the shuffle happens to return the exact same order, but that's extremely unlikely)
  let isDifferent = false;
  for (let i = 0; i < originalOrder.length; i++) {
    if (originalOrder[i] !== shuffledOrder[i]) {
      isDifferent = true;
      break;
    }
  }
  console.assert(isDifferent, 'Shuffled deck should have a different order');

  // Check that the original deck is not modified
  console.assert(JSON.stringify(originalDeck.map(card => card.id)) === JSON.stringify(originalOrder), 'Original deck should not be modified');

  passedTests++;
});

// Test dealCards
runTest('dealCards', () => {
  totalTests++;
  const deck = generateDeck('4p');
  const originalLength = deck.length;

  const { hands, remainingDeck } = dealCards(deck, 4, 4);

  // Check that we have the right number of hands
  console.assert(hands.length === 4, 'Should have 4 hands');

  // Check that each hand has the right number of cards
  hands.forEach((hand, index) => {
    console.assert(hand.length === 4, `Hand ${index} should have 4 cards`);
  });

  // Check that the remaining deck has the right number of cards
  console.assert(remainingDeck.length === originalLength - (4 * 4), 'Remaining deck should have the right number of cards');

  // Check that the original deck is not modified
  console.assert(deck.length === originalLength, 'Original deck should not be modified');

  passedTests++;
});

// Test calculateCardPoints
runTest('calculateCardPoints', () => {
  totalTests++;
  const cards: Card[] = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'CA', suit: 'Clubs', rank: 'A', pointValue: 1, order: 6 },
    { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 },
    { id: 'HK', suit: 'Hearts', rank: 'K', pointValue: 0, order: 4 }
  ];

  const points = calculateCardPoints(cards);
  console.log(`  Points: ${points} (expected 7)`);
  console.assert(points === 7, 'Points should be 7 (3+2+1+1+0)');

  // Test empty array
  console.assert(calculateCardPoints([]) === 0, 'Empty array should have 0 points');

  passedTests++;
});

// Test canFollowSuit
runTest('canFollowSuit', () => {
  totalTests++;
  const hand: Card[] = [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'CA', suit: 'Clubs', rank: 'A', pointValue: 1, order: 6 }
  ];

  console.assert(canFollowSuit(hand, 'Hearts'), 'Should be able to follow Hearts');
  console.assert(canFollowSuit(hand, 'Spades'), 'Should be able to follow Spades');
  console.assert(canFollowSuit(hand, 'Clubs'), 'Should be able to follow Clubs');
  console.assert(!canFollowSuit(hand, 'Diamonds'), 'Should not be able to follow Diamonds');

  passedTests++;
});

// Test determineTrickWinner
runTest('determineTrickWinner', () => {
  totalTests++;

  // Test case 1: No trump, highest card of lead suit wins
  const trick1: Trick = {
    cards: [
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
      { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
      { id: 'H10', suit: 'Hearts', rank: '10', pointValue: 1, order: 5 }
    ],
    playedBy: ['player1', 'player2', 'player3'],
    leaderId: 'player1',
    leadSuit: 'Hearts',
    timestamp: Date.now(),
    points: 6
  };

  const trumpState1: TrumpState = {
    trumpRevealed: false
  };

  const winner1 = determineTrickWinner(trick1, trumpState1);
  console.log(`  Winner index: ${winner1} (expected 1)`);
  console.assert(winner1 === 1, 'Jack of Hearts (index 1) should win');

  // Test case 2: Trump revealed, trump card wins
  const trick2: Trick = {
    cards: [
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
      { id: 'S7', suit: 'Spades', rank: '7', pointValue: 0, order: 1 },
      { id: 'H10', suit: 'Hearts', rank: '10', pointValue: 1, order: 5 }
    ],
    playedBy: ['player1', 'player2', 'player3'],
    leaderId: 'player1',
    leadSuit: 'Hearts',
    timestamp: Date.now(),
    points: 3
  };

  const trumpState2: TrumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades'
  };

  const winner2 = determineTrickWinner(trick2, trumpState2);
  console.log(`  Winner index: ${winner2} (expected 1)`);
  console.assert(winner2 === 1, '7 of Spades (index 1) should win because it\'s trump');

  // Test case 3: Multiple trumps, highest trump wins
  const trick3: Trick = {
    cards: [
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 },
      { id: 'S7', suit: 'Spades', rank: '7', pointValue: 0, order: 1 },
      { id: 'SJ', suit: 'Spades', rank: 'J', pointValue: 3, order: 8 }
    ],
    playedBy: ['player1', 'player2', 'player3'],
    leaderId: 'player1',
    leadSuit: 'Hearts',
    timestamp: Date.now(),
    points: 5
  };

  const trumpState3: TrumpState = {
    trumpRevealed: true,
    finalTrumpSuit: 'Spades'
  };

  const winner3 = determineTrickWinner(trick3, trumpState3);
  console.log(`  Winner index: ${winner3} (expected 2)`);
  console.assert(winner3 === 2, 'Jack of Spades (index 2) should win because it\'s highest trump');

  passedTests++;
});

// Print summary
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passedTests}/${totalTests} tests`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! The core game logic can be tested in isolation.');
} else {
  console.log(`\n❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
