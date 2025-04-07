import { generateDeck, calculateCardPoints } from '../../../services/local/cardUtils';
import { Card } from '../../../models/card';

describe('Card Utilities', () => {
  describe('generateDeck', () => {
    test('should generate 24 cards for 3-player mode', () => {
      const deck = generateDeck('3p');
      expect(deck.length).toBe(24);

      // Check that we have the right cards (A, K, Q, J, 10, 9 in each suit)
      const ranks = deck.map(card => card.rank);
      expect(ranks).toContain('A');
      expect(ranks).toContain('K');
      expect(ranks).toContain('Q');
      expect(ranks).toContain('J');
      expect(ranks).toContain('10');
      expect(ranks).toContain('9');
      expect(ranks).not.toContain('8');
      expect(ranks).not.toContain('7');
    });

    test('should generate 32 cards for 4-player mode', () => {
      const deck = generateDeck('4p');
      expect(deck.length).toBe(32);

      // Check that we have the right cards (A, K, Q, J, 10, 9, 8, 7 in each suit)
      const ranks = deck.map(card => card.rank);
      expect(ranks).toContain('A');
      expect(ranks).toContain('K');
      expect(ranks).toContain('Q');
      expect(ranks).toContain('J');
      expect(ranks).toContain('10');
      expect(ranks).toContain('9');
      expect(ranks).toContain('8');
      expect(ranks).toContain('7');
    });
  });

  describe('calculateCardPoints', () => {
    test('should correctly calculate points for a set of cards', () => {
      const cards: Card[] = [
        { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
        { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
        { id: 'CA', suit: 'Clubs', rank: 'A', pointValue: 1, order: 6 },
        { id: 'D10', suit: 'Diamonds', rank: '10', pointValue: 1, order: 5 },
        { id: 'HK', suit: 'Hearts', rank: 'K', pointValue: 0, order: 4 }
      ];

      const points = calculateCardPoints(cards);
      expect(points).toBe(7); // 3 + 2 + 1 + 1 + 0
    });

    test('should return 0 for an empty array', () => {
      expect(calculateCardPoints([])).toBe(0);
    });
  });
});
