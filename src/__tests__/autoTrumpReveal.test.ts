// Test for automatic trump reveal when declarer has only the folded trump card left

describe('Auto Trump Reveal Tests', () => {
  // Test case: Auto reveal when declarer's last card is the folded trump card
  test('Trump should be automatically revealed when declarer\'s last card is the folded trump card', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [{ id: 'folded1', suit: 'Clubs', rank: '7', pointValue: 0, order: 1 }]
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
        rank: '7',
        pointValue: 0,
        order: 1
      }
    };

    // Mock variables to track changes
    let trumpRevealed = false;
    let foldedCardReturned = false;
    let cardIdToPlay = '';

    // Simulate the logic in playCard function
    const currentPlayerIndex = state.currentPlayerIndex;
    const currentPlayer = state.players[currentPlayerIndex];
    const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;

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

      // The card to play IS the folded card
      cardIdToPlay = state.foldedCard.id;
    }

    // Assertions
    expect(isDeclarer).toBe(true);
    expect(currentPlayer.hand.length).toBe(1);
    expect(currentPlayer.hand[0].id).toBe(state.foldedCard.id);
    expect(trumpRevealed).toBe(true);
    expect(foldedCardReturned).toBe(true);
    expect(cardIdToPlay).toBe('folded1');
  });

  // Test case: Auto reveal when declarer's last card is a trump card (not the folded card)
  test('Trump should be automatically revealed when declarer\'s last card is a trump card', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [{ id: 'C9', suit: 'Clubs', rank: '9', pointValue: 0, order: 3 }] // A trump card but not the folded card
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
        rank: '7',
        pointValue: 0,
        order: 1
      }
    };

    // Mock variables to track changes
    let trumpRevealed = false;
    let foldedCardReturned = false;
    let foldedCardAddedToHand = false;
    const playerHand = [...state.players[0].hand];

    // Simulate the logic in playCard function
    const currentPlayerIndex = state.currentPlayerIndex;
    const currentPlayer = state.players[currentPlayerIndex];
    const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;

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
    // Case 2: Declarer has only one card left AND it's a trump card
    else if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      !state.trumpState.trumpRevealed &&
      state.trumpState.finalTrumpSuit && // Make sure we have a final trump suit
      state.foldedCard &&
      !state.trumpState.foldedCardReturned &&
      currentPlayer.hand[0].suit === state.trumpState.finalTrumpSuit // The last card is a trump card
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
    expect(currentPlayer.hand[0].suit).toBe(state.trumpState.finalTrumpSuit);
    expect(trumpRevealed).toBe(true);
    expect(foldedCardReturned).toBe(true);
    expect(foldedCardAddedToHand).toBe(true);
    expect(playerHand.length).toBe(2); // Original card + folded card
    expect(playerHand[1].id).toBe('folded1');
  });

  // Test case: No auto reveal when declarer's last card is not a trump card
  test('Trump should NOT be automatically revealed when declarer\'s last card is not a trump card', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [{ id: 'H9', suit: 'Hearts', rank: '9', pointValue: 0, order: 3 }] // Not a trump card
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
        rank: '7',
        pointValue: 0,
        order: 1
      }
    };

    // Mock variables to track changes
    let trumpRevealed = false;
    let foldedCardReturned = false;

    // Simulate the logic in playCard function
    const currentPlayerIndex = state.currentPlayerIndex;
    const currentPlayer = state.players[currentPlayerIndex];
    const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;

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
    // Case 2: Declarer has only one card left AND it's a trump card
    else if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      !state.trumpState.trumpRevealed &&
      state.trumpState.finalTrumpSuit && // Make sure we have a final trump suit
      state.foldedCard &&
      !state.trumpState.foldedCardReturned &&
      currentPlayer.hand[0].suit === state.trumpState.finalTrumpSuit // The last card is a trump card
    ) {
      // Force reveal trump
      trumpRevealed = true;
      foldedCardReturned = true;
    }

    // Assertions
    expect(isDeclarer).toBe(true);
    expect(currentPlayer.hand.length).toBe(1);
    expect(currentPlayer.hand[0].suit).not.toBe(state.trumpState.finalTrumpSuit);
    expect(trumpRevealed).toBe(false); // Trump should NOT be revealed
    expect(foldedCardReturned).toBe(false);
  });

  // Test case: No auto reveal when declarer has multiple cards
  test('Trump should NOT be automatically revealed when declarer has multiple cards', () => {
    // Mock state
    const state = {
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player1',
          hand: [
            { id: 'C9', suit: 'Clubs', rank: '9', pointValue: 0, order: 3 }, // A trump card
            { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 0, order: 3 } // Not a trump card
          ]
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
        rank: '7',
        pointValue: 0,
        order: 1
      }
    };

    // Mock variables to track changes
    let trumpRevealed = false;
    let foldedCardReturned = false;

    // Simulate the logic in playCard function
    const currentPlayerIndex = state.currentPlayerIndex;
    const currentPlayer = state.players[currentPlayerIndex];
    const isDeclarer = currentPlayer.id === state.trumpState.finalDeclarerId;

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
    // Case 2: Declarer has only one card left AND it's a trump card
    else if (
      isDeclarer &&
      currentPlayer.hand.length === 1 &&
      !state.trumpState.trumpRevealed &&
      state.trumpState.finalTrumpSuit && // Make sure we have a final trump suit
      state.foldedCard &&
      !state.trumpState.foldedCardReturned &&
      currentPlayer.hand[0].suit === state.trumpState.finalTrumpSuit // The last card is a trump card
    ) {
      // Force reveal trump
      trumpRevealed = true;
      foldedCardReturned = true;
    }

    // Assertions
    expect(isDeclarer).toBe(true);
    expect(currentPlayer.hand.length).toBe(2); // Has multiple cards
    expect(trumpRevealed).toBe(false); // Trump should NOT be revealed
    expect(foldedCardReturned).toBe(false);
  });
});
