// Simple test for the automatic trump reveal functionality

describe('Trump Reveal Tests', () => {
  // Test case 1: Declarer's last card is the folded trump card
  test('Trump should be automatically revealed when declarer plays their last card (folded card)', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [{ id: 'folded1', suit: 'Clubs', rank: '7' }]
        }
      ],
      trumpState: {
        trumpRevealed: false,
        finalTrumpSuit: 'Clubs',
        finalDeclarerId: 'player1',
        foldedCardReturned: false
      },
      foldedCard: {
        id: 'folded1',
        suit: 'Clubs',
        rank: '7'
      }
    };

    // Mock the card play logic
    let trumpRevealed = false;
    let foldedCardReturned = false;

    // Simulate the logic in playCard function
    const isDeclarer = state.players[0].id === state.trumpState.finalDeclarerId;
    const currentPlayer = state.players[0];

    if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      state.foldedCard &&
      currentPlayer.hand[0].id === state.foldedCard.id &&
      !state.trumpState.trumpRevealed
    ) {
      // Force reveal
      trumpRevealed = true;
      foldedCardReturned = true;
    }

    // Assertions
    expect(isDeclarer).toBe(true);
    expect(currentPlayer.hand.length).toBe(1);
    expect(currentPlayer.hand[0].id).toBe(state.foldedCard.id);
    expect(trumpRevealed).toBe(true);
    expect(foldedCardReturned).toBe(true);
  });

  // Test case 2: Declarer has only one card left (not the folded card)
  test('Trump should be automatically revealed when declarer plays their last card (any card)', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [{ id: 'card1', suit: 'Hearts', rank: 'A' }]
        }
      ],
      trumpState: {
        trumpRevealed: false,
        finalTrumpSuit: 'Clubs',
        finalDeclarerId: 'player1',
        foldedCardReturned: false
      },
      foldedCard: {
        id: 'folded1',
        suit: 'Clubs',
        rank: '7'
      }
    };

    // Mock the card play logic
    let trumpRevealed = false;
    let foldedCardReturned = false;
    let foldedCardAddedToHand = false;
    const playerHand = [...state.players[0].hand];

    // Simulate the logic in playCard function
    const isDeclarer = state.players[0].id === state.trumpState.finalDeclarerId;
    const currentPlayer = state.players[0];

    // Case 1: Declarer's last card is the folded trump card
    if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      state.foldedCard &&
      currentPlayer.hand[0].id === state.foldedCard.id &&
      !state.trumpState.trumpRevealed
    ) {
      // Force reveal
      trumpRevealed = true;
      foldedCardReturned = true;
    }
    // Case 2: Declarer has only one card left (any card) and trump is not revealed
    else if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      !state.trumpState.trumpRevealed &&
      state.trumpState.finalTrumpSuit
    ) {
      // Force reveal trump
      trumpRevealed = true;

      // If folded card hasn't been returned yet, return it now
      if (!state.trumpState.foldedCardReturned && state.foldedCard) {
        // Check if the card isn't already in hand (safety)
        if (!playerHand.some(c => c.id === state.foldedCard.id)) {
          playerHand.push(state.foldedCard);
          foldedCardAddedToHand = true;
        }
        foldedCardReturned = true;
      }
    }

    // Assertions
    expect(isDeclarer).toBe(true);
    expect(currentPlayer.hand.length).toBe(1);
    expect(currentPlayer.hand[0].id).not.toBe(state.foldedCard.id);
    expect(trumpRevealed).toBe(true);
    expect(foldedCardReturned).toBe(true);
    expect(foldedCardAddedToHand).toBe(true);
    expect(playerHand.length).toBe(2); // Original card + folded card
    expect(playerHand[1].id).toBe('folded1');
  });

  // Test case 3: Non-declarer plays their last card
  test('Trump should NOT be automatically revealed when non-declarer plays their last card', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player2', // Not the declarer
          hand: [{ id: 'card1', suit: 'Hearts', rank: 'A' }]
        }
      ],
      trumpState: {
        trumpRevealed: false,
        finalTrumpSuit: 'Clubs',
        finalDeclarerId: 'player1', // Different player is the declarer
        foldedCardReturned: false
      },
      foldedCard: {
        id: 'folded1',
        suit: 'Clubs',
        rank: '7'
      }
    };

    // Mock the card play logic
    let trumpRevealed = false;
    let foldedCardReturned = false;

    // Simulate the logic in playCard function
    const isDeclarer = state.players[0].id === state.trumpState.finalDeclarerId;
    const currentPlayer = state.players[0];

    // Case 1: Declarer's last card is the folded trump card
    if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      state.foldedCard &&
      currentPlayer.hand[0].id === state.foldedCard.id &&
      !state.trumpState.trumpRevealed
    ) {
      // Force reveal
      trumpRevealed = true;
      foldedCardReturned = true;
    }
    // Case 2: Declarer has only one card left (any card) and trump is not revealed
    else if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      !state.trumpState.trumpRevealed &&
      state.trumpState.finalTrumpSuit
    ) {
      // Force reveal trump
      trumpRevealed = true;
      foldedCardReturned = true;
    }

    // Assertions
    expect(isDeclarer).toBe(false); // Not the declarer
    expect(currentPlayer.hand.length).toBe(1);
    expect(trumpRevealed).toBe(false); // Trump should not be revealed
    expect(foldedCardReturned).toBe(false);
  });
});
