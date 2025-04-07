import { useGameStore } from './store/gameStore';

// Run the test
function runTest() {
  console.log("Starting trick confirmation store test...");
  
  // Initialize the game
  const store = useGameStore.getState();
  store.initializeGame(['Player 1', 'Player 2', 'Player 3'], '3p');
  
  // Deal cards
  store.startGame();
  
  // Set up a specific game state for testing
  useGameStore.setState(state => {
    // Set up specific cards for each player
    state.players[0].hand = [
      { id: 'HA', suit: 'Hearts', rank: 'A', pointValue: 1, order: 6 }
    ];
    
    state.players[1].hand = [
      { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 }
    ];
    
    state.players[2].hand = [
      { id: 'H9', suit: 'Hearts', rank: '9', pointValue: 2, order: 7 }
    ];
    
    // Set up trump state
    state.trumpState = {
      trumpRevealed: true,
      finalTrumpSuit: 'Spades',
      finalDeclarerId: state.players[1].id
    };
    
    // Set up current trick
    state.currentTrick = {
      cards: [],
      playedBy: [],
      leaderId: state.players[0].id,
      leadSuit: 'Hearts',
      timestamp: Date.now(),
      points: 0
    };
    
    // Set current phase to playing
    state.currentPhase = 'playing_start_trick';
    state.currentPlayerIndex = 0; // Player 1 starts
  });
  
  console.log("Initial state:");
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  console.log(`  Current player: ${useGameStore.getState().players[useGameStore.getState().currentPlayerIndex].name}`);
  
  // Play cards to complete the trick
  console.log("\nPlaying cards to complete the trick...");
  
  // Player 1 plays a Heart
  store.playCard(useGameStore.getState().players[0].id, 'HA');
  console.log(`  Player 1 played HA`);
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  
  // Player 2 plays a Spade (trump)
  store.playCard(useGameStore.getState().players[1].id, 'S9');
  console.log(`  Player 2 played S9`);
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  
  // Player 3 plays a Heart
  store.playCard(useGameStore.getState().players[2].id, 'H9');
  console.log(`  Player 3 played H9`);
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  
  // At this point, the trick should be complete and awaiting confirmation
  console.log("\nTrick completed:");
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  console.log(`  Completed trick awaiting confirmation: ${useGameStore.getState().completedTrickAwaitingConfirmation ? 'Yes' : 'No'}`);
  
  if (useGameStore.getState().completedTrickAwaitingConfirmation) {
    console.log(`  Winner: ${useGameStore.getState().players.find(p => p.id === useGameStore.getState().completedTrickAwaitingConfirmation?.winnerId)?.name}`);
    console.log(`  Points: ${useGameStore.getState().completedTrickAwaitingConfirmation.points}`);
  }
  
  // Confirm the trick
  console.log("\nConfirming the trick...");
  store.confirmTrick();
  
  console.log("\nAfter confirmation:");
  console.log(`  Current phase: ${useGameStore.getState().currentPhase}`);
  console.log(`  Completed tricks: ${useGameStore.getState().completedTricks.length}`);
  console.log(`  Current trick: ${useGameStore.getState().currentTrick ? 'Exists' : 'Null'}`);
  
  if (useGameStore.getState().completedTricks.length > 0) {
    const lastTrick = useGameStore.getState().completedTricks[useGameStore.getState().completedTricks.length - 1];
    console.log(`  Last completed trick winner: ${useGameStore.getState().players.find(p => p.id === lastTrick.winnerId)?.name}`);
  }
  
  console.log("\nTest completed!");
}

// Run the test
runTest();
