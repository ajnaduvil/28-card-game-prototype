// Test to verify that the declarer cannot lead with a trump card when the trump is not revealed
import { isValidPlay } from '../services/local/cardUtils';

describe('Declarer Lead Trump Tests', () => {
  // Test case: Declarer cannot lead with a trump card when the trump is not revealed
  test('Declarer cannot lead with a trump card when the trump is not revealed', () => {

    // Mock state
    const card = { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }; // A club card (trump suit)
    const playerId = 'player1'; // Declarer
    const hand = [
      { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }, // Trump card
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }, // Non-trump card
      { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 } // Non-trump card
    ];
    const currentTrick = {
      cards: [], // Empty trick (leading)
      playedBy: [],
      leaderId: 'player1',
      leadSuit: 'Hearts', // Will be updated when first card is played
      timestamp: Date.now(),
      points: 0
    };
    const trumpState = {
      trumpRevealed: false,
      finalTrumpSuit: 'Clubs',
      finalDeclarerId: 'player1',
      foldedCardReturned: false
    };
    const finalDeclarerId = 'player1';

    // Call isValidPlay to check if the declarer can lead with a trump card
    const isValid = isValidPlay(
      card,
      playerId,
      hand,
      currentTrick,
      trumpState,
      finalDeclarerId
    );

    // The play should be invalid
    expect(isValid).toBe(false);
  });

  // Test case: Declarer can lead with a non-trump card when the trump is not revealed
  test('Declarer can lead with a non-trump card when the trump is not revealed', () => {

    // Mock state
    const card = { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }; // A heart card (non-trump)
    const playerId = 'player1'; // Declarer
    const hand = [
      { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }, // Trump card
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }, // Non-trump card
      { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 } // Non-trump card
    ];
    const currentTrick = {
      cards: [], // Empty trick (leading)
      playedBy: [],
      leaderId: 'player1',
      leadSuit: 'Hearts', // Will be updated when first card is played
      timestamp: Date.now(),
      points: 0
    };
    const trumpState = {
      trumpRevealed: false,
      finalTrumpSuit: 'Clubs',
      finalDeclarerId: 'player1',
      foldedCardReturned: false
    };
    const finalDeclarerId = 'player1';

    // Call isValidPlay to check if the declarer can lead with a non-trump card
    const isValid = isValidPlay(
      card,
      playerId,
      hand,
      currentTrick,
      trumpState,
      finalDeclarerId
    );

    // The play should be valid
    expect(isValid).toBe(true);
  });

  // Test case: Non-declarer can lead with a trump card when the trump is not revealed
  test('Non-declarer can lead with a trump card when the trump is not revealed', () => {

    // Mock state
    const card = { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }; // A club card (trump suit)
    const playerId = 'player2'; // Not the declarer
    const hand = [
      { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }, // Trump card
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }, // Non-trump card
      { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 } // Non-trump card
    ];
    const currentTrick = {
      cards: [], // Empty trick (leading)
      playedBy: [],
      leaderId: 'player2',
      leadSuit: 'Hearts', // Will be updated when first card is played
      timestamp: Date.now(),
      points: 0
    };
    const trumpState = {
      trumpRevealed: false,
      finalTrumpSuit: 'Clubs',
      finalDeclarerId: 'player1', // Player 1 is the declarer, not player 2
      foldedCardReturned: false
    };
    const finalDeclarerId = 'player1';

    // Call isValidPlay to check if a non-declarer can lead with a trump card
    const isValid = isValidPlay(
      card,
      playerId,
      hand,
      currentTrick,
      trumpState,
      finalDeclarerId
    );

    // The play should be valid
    expect(isValid).toBe(true);
  });

  // Test case: Declarer can lead with a trump card when the trump is revealed
  test('Declarer can lead with a trump card when the trump is revealed', () => {

    // Mock state
    const card = { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }; // A club card (trump suit)
    const playerId = 'player1'; // Declarer
    const hand = [
      { id: 'CS', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }, // Trump card
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }, // Non-trump card
      { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 } // Non-trump card
    ];
    const currentTrick = {
      cards: [], // Empty trick (leading)
      playedBy: [],
      leaderId: 'player1',
      leadSuit: 'Hearts', // Will be updated when first card is played
      timestamp: Date.now(),
      points: 0
    };
    const trumpState = {
      trumpRevealed: true, // Trump is revealed
      finalTrumpSuit: 'Clubs',
      finalDeclarerId: 'player1',
      foldedCardReturned: true
    };
    const finalDeclarerId = 'player1';

    // Call isValidPlay to check if the declarer can lead with a trump card when trump is revealed
    const isValid = isValidPlay(
      card,
      playerId,
      hand,
      currentTrick,
      trumpState,
      finalDeclarerId
    );

    // The play should be valid
    expect(isValid).toBe(true);
  });
});
