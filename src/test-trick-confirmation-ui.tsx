import React from 'react';
import ReactDOM from 'react-dom/client';
import TrickConfirmationOverlay from './components/game/TrickConfirmationOverlay';
import { Trick } from './models/game';

// Create a sample trick
const sampleTrick: Trick = {
  cards: [
    { id: 'HJ', suit: 'Hearts', rank: 'J', pointValue: 3, order: 8 },
    { id: 'S9', suit: 'Spades', rank: '9', pointValue: 2, order: 7 },
    { id: 'CA', suit: 'Clubs', rank: 'A', pointValue: 1, order: 6 }
  ],
  playedBy: ['player1', 'player2', 'player3'],
  leaderId: 'player1',
  leadSuit: 'Hearts',
  timestamp: Date.now(),
  points: 6,
  winnerId: 'player2'
};

// Create a simple test component
const TestApp: React.FC = () => {
  const [showConfirmation, setShowConfirmation] = React.useState(true);
  
  const handleConfirm = () => {
    console.log('Trick confirmed!');
    setShowConfirmation(false);
    setTimeout(() => setShowConfirmation(true), 2000); // Show again after 2 seconds
  };
  
  return (
    <div className="min-h-screen bg-green-900 p-4">
      <h1 className="text-xl font-bold mb-4 text-white">Trick Confirmation Test</h1>
      
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Show Confirmation
      </button>
      
      {showConfirmation && (
        <TrickConfirmationOverlay
          trick={sampleTrick}
          onConfirm={handleConfirm}
          winnerName="Player 2"
          autoConfirmDelay={5000} // 5 seconds for testing
        />
      )}
    </div>
  );
};

// Render the test component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
