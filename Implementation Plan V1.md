# 28 Card Game Implementation Plan

This implementation plan outlines a modular, phased approach to developing the 28 card game. The plan is structured to allow offline development of core game functionality first, with Firebase integration for authentication and multiplayer features in a later phase.

## Phase 1: Core Game Logic and Local Multiplayer

In this phase, we'll focus on building the core game mechanics and a local multiplayer experience that can be played on a single device. This approach allows for development and testing without requiring internet connectivity or backend services.

### Step 1: Project Setup and Basic Structure

1. **Initialize React Project with Vite**
   - Use TypeScript for type safety
   - Set up project structure with Vite: `yarn create vite 28-card-game --template react-ts`
   - Configure ESLint and Prettier for code quality

2. **Install Core Dependencies**
   - Tailwind CSS and DaisyUI for styling
   - Zustand for state management
   - React Router for navigation
   - Framer Motion for animations

3. **Create Basic Project Structure**
   ```
   src/
   ├── assets/            # Images, fonts, etc.
   ├── components/        # Reusable UI components
   │   ├── ui/            # Basic UI elements (buttons, inputs, etc.)
   │   ├── game/          # Game-specific components
   │   └── layout/        # Layout components
   ├── hooks/             # Custom React hooks
   ├── models/            # TypeScript interfaces and types
   ├── services/          # Service layer
   │   ├── local/         # Local game services (Phase 1)
   │   └── firebase/      # Firebase services (Phase 2)
   ├── store/             # Zustand stores
   ├── utils/             # Utility functions
   ├── pages/             # Page components
   ├── App.tsx            # Main App component
   └── main.tsx           # Entry point
   ```

### Step 2: Core Game Models and Types

1. **Define Core Game Types**
   - Create TypeScript interfaces for:
     - Card (suit, rank, point value)
     - Player (id, name, hand, etc.)
     - Game State (players, current phase, dealer, etc.)
     - Bid (amount, player, isHonors, etc.)
     - Trick (cards played, leader, winner, etc.)

2. **Implement Card Utilities**
   - Card creation and deck generation functions
   - Deck shuffling algorithm
   - Card comparison functions (for determining trick winners)
   - Point calculation functions

### Step 3: Game Logic Implementation

1. **Game State Management**
   - Create a Zustand store for game state
   - Implement state transitions between game phases
   - Define actions for game state mutations

2. **Core Game Rules Implementation**
   - Implement deck creation (32 cards for 4p, 24 cards for 3p)
   - Implement dealing logic (4 cards first batch, 4 cards second batch)
   - Implement bidding rules and validation
   - Implement trump selection and folding mechanics
   - Implement trick playing rules (following suit, trump rules)
   - Implement trick winner determination
   - Implement scoring logic

3. **Game Flow Control**
   - Implement turn management
   - Implement phase transitions (bidding → trump selection → playing → scoring)
   - Implement round and game completion logic

### Step 4: Basic UI Components

1. **Card Component**
   - Visual representation of cards
   - Interactive behavior (selection, highlighting)
   - Animation capabilities

2. **Player Area Component**
   - Display player information
   - Show hand of cards
   - Indicate current player's turn

3. **Game Table Component**
   - Layout for the game board
   - Positioning of players around the table
   - Display area for current trick
   - Display area for folded trump card

4. **Bidding Interface**
   - Bid input controls
   - Display current highest bid
   - Pass button

5. **Trump Selection Interface**
   - Card selection for folding
   - Confirmation controls

### Step 5: Local Multiplayer Implementation

1. **Game Setup Screen**
   - Player count selection (3 or 4)
   - Player name inputs
   - Game start button

2. **Turn-Based Play Mechanism**
   - Implement "hot seat" style play where the device is passed between players
   - Add a "Ready for next player" transition screen to prevent seeing other players' hands
   - Hide/show hands based on current player

3. **Game State Persistence**
   - Save game state to localStorage to allow resuming games
   - Implement game history tracking

### Step 6: Game UI Refinement

1. **Animations and Visual Feedback**
   - Card dealing animations
   - Card playing animations
   - Trick collection animations
   - Turn indicators

2. **Game Information Display**
   - Current phase indicator
   - Bidding history
   - Score display
   - Trump suit indicator (when revealed)

3. **Responsive Design**
   - Ensure playability on different screen sizes
   - Optimize layout for mobile devices in landscape orientation

### Step 7: Testing and Refinement

1. **Manual Testing**
   - Test all game rules and edge cases
   - Verify scoring logic
   - Test UI on different devices and screen sizes

2. **Bug Fixes and Improvements**
   - Address any issues found during testing
   - Refine UI based on playability feedback

## Phase 2: Online Multiplayer with Firebase

In this phase, we'll integrate Firebase services to enable online multiplayer functionality, user authentication, and persistent game data.

### Step 1: Firebase Project Setup

1. **Create Firebase Project**
   - Set up a new Firebase project
   - Configure Firebase services (Authentication, Firestore, Cloud Functions)

2. **Install Firebase Dependencies**
   - Add Firebase SDK to the project
   - Configure Firebase initialization

3. **Create Firebase Service Layer**
   - Implement service classes for Firebase interactions
   - Create adapters to convert between local models and Firebase data structures

### Step 2: User Authentication

1. **Authentication UI**
   - Create login screen
   - Create registration screen
   - Implement form validation

2. **Authentication Logic**
   - Implement email/password authentication
   - Add Google authentication (optional)
   - Handle authentication state persistence

3. **User Profile Management**
   - Create user profile in Firestore on registration
   - Implement profile update functionality
   - Add avatar selection/upload

### Step 3: Online Game Lobby

1. **Game Lobby UI**
   - Create lobby screen with available games list
   - Add create game button and form
   - Implement join game functionality

2. **Lobby Data Management**
   - Set up Firestore collections for games
   - Implement real-time updates for game listings
   - Create Cloud Functions for game creation and joining

3. **Waiting Room Implementation**
   - Create waiting room UI showing joined players
   - Implement real-time updates for player joins/leaves
   - Add leave game functionality

### Step 4: Online Game State Synchronization

1. **Game State in Firestore**
   - Design Firestore schema for game state
   - Implement security rules to protect game data
   - Create Cloud Functions for game state transitions

2. **Real-time Game Updates**
   - Set up listeners for game state changes
   - Implement UI updates based on real-time data
   - Handle concurrent actions and conflicts

3. **Player Hand Security**
   - Implement secure storage of player hands
   - Ensure players can only see their own cards
   - Create Cloud Functions for card dealing and playing

### Step 5: Game Action Implementation

1. **Bidding Actions**
   - Create Cloud Functions for bid submission and validation
   - Implement client-side bid submission
   - Add real-time updates for bidding state

2. **Trump Selection Actions**
   - Implement secure trump selection and storage
   - Create Cloud Functions for trump reveal requests
   - Add client-side trump selection UI

3. **Card Playing Actions**
   - Create Cloud Functions for card play validation
   - Implement client-side card selection and submission
   - Add real-time updates for trick state

### Step 6: Game Completion and Scoring

1. **Round Completion Logic**
   - Implement server-side round completion detection
   - Create scoring calculation Cloud Functions
   - Add round results display

2. **Game Completion Logic**
   - Implement game completion detection
   - Create game results calculation
   - Add game over screen and return to lobby functionality

3. **Game History and Statistics**
   - Store completed game data
   - Implement player statistics tracking
   - Add game history viewing

### Step 7: Presence and Disconnection Handling

1. **Player Presence System**
   - Implement Firebase presence detection
   - Create UI indicators for player connection status
   - Add reconnection handling

2. **Disconnection Handling**
   - Implement timeout logic for disconnected players
   - Create game state recovery mechanisms
   - Add forfeit/cancellation rules for abandoned games

### Step 8: Testing and Optimization

1. **End-to-End Testing**
   - Test multiplayer functionality with multiple devices
   - Verify real-time updates and synchronization
   - Test disconnection and reconnection scenarios

2. **Performance Optimization**
   - Optimize Firestore queries and data structure
   - Implement caching strategies
   - Reduce unnecessary real-time listeners

3. **Security Audit**
   - Review Firestore security rules
   - Test for potential vulnerabilities
   - Ensure proper authentication and authorization

## Detailed Technical Implementation Guidelines

### Core Game Logic Module

The core game logic should be implemented as a standalone module that can work without Firebase. This ensures that the game can be played offline and makes testing easier.

```typescript
// Example structure for the core game logic module
export class GameEngine {
  constructor(playerCount: 3 | 4) {
    // Initialize game state based on player count
  }

  // Game setup methods
  initializeGame(): void
  dealFirstBatch(): Card[][]
  dealSecondBatch(): Card[][]

  // Bidding methods
  placeBid(playerId: string, amount: number): boolean
  passBid(playerId: string): boolean
  isValidBid(amount: number, currentPhase: GamePhase): boolean

  // Trump selection methods
  selectProvisionalTrump(playerId: string, card: Card): boolean
  selectFinalTrump(playerId: string, card: Card, keepProvisional?: boolean): boolean

  // Card playing methods
  playCard(playerId: string, card: Card): boolean
  isValidPlay(playerId: string, card: Card): boolean
  determineTrickWinner(trick: Trick, trumpSuit?: Suit): string
  
  // Trump reveal methods
  requestTrumpReveal(playerId: string): boolean
  
  // Scoring methods
  calculateRoundScore(): RoundScore
  updateGameScore(): GameScore
  isGameComplete(): boolean

  // State transition methods
  advanceToNextPhase(): void
  advanceToNextPlayer(): void
  startNextRound(): void
}
```

### State Management with Zustand

Zustand provides a simple and efficient way to manage game state. The store should be structured to handle both local and online gameplay.

```typescript
// Example Zustand store structure
interface GameState {
  // Game configuration
  gameMode: '3p' | '4p'
  isOnline: boolean
  
  // Game state
  currentPhase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  dealerIndex: number
  originalBidderIndex: number
  
  // Bidding state
  currentBids: Bid[]
  highestBid: Bid | null
  
  // Trump state
  provisionalTrumpSuit: Suit | null
  finalTrumpSuit: Suit | null
  trumpRevealed: boolean
  
  // Playing state
  currentTrick: Card[]
  trickLeaderIndex: number
  completedTricks: CompletedTrick[]
  
  // Scoring
  roundScores: RoundScore[]
  gameScores: GameScore
  
  // Actions
  initializeGame: (playerCount: 3 | 4, playerNames: string[]) => void
  placeBid: (amount: number) => void
  passBid: () => void
  selectTrump: (card: Card) => void
  playCard: (card: Card) => void
  requestTrumpReveal: () => void
  // ... other actions
}
```

### Firebase Integration

When integrating with Firebase, create adapter functions that convert between the local game state and Firebase data structures.

```typescript
// Example Firebase adapter
export class FirebaseGameAdapter {
  constructor(private gameId: string) {
    // Initialize Firebase references
  }

  // Convert local game state to Firebase format
  serializeGameState(state: GameState): FirebaseGameState {
    // Transform local state to Firebase format
  }

  // Convert Firebase data to local game state
  deserializeGameState(data: FirebaseGameState): GameState {
    // Transform Firebase data to local state
  }

  // Listen for game state changes
  subscribeToGameChanges(callback: (state: GameState) => void): Unsubscribe {
    // Set up Firestore onSnapshot listener
  }

  // Update game state in Firebase
  updateGameState(state: GameState): Promise<void> {
    // Update Firestore document
  }

  // Player-specific methods
  getPlayerHand(playerId: string): Promise<Card[]> {
    // Fetch player's hand from secure location
  }

  updatePlayerHand(playerId: string, hand: Card[]): Promise<void> {
    // Update player's hand in secure location
  }
}
```

### Separation of Concerns

Maintain clear separation between:

1. **Game Logic**: Rules enforcement, state transitions, calculations
2. **State Management**: Storage and updates of game state
3. **UI Components**: Visual representation and user interactions
4. **Service Layer**: Communication with external systems (Firebase)

This separation allows for:
- Easy switching between local and online play
- Independent testing of each layer
- Potential reuse of game logic in different UIs (e.g., mobile app)

### Security Considerations

For the Firebase implementation:

1. **Firestore Security Rules**: Ensure players can only:
   - Read game metadata they have access to
   - Read their own hand data
   - Read shared game state
   - Make valid game actions through Cloud Functions

2. **Cloud Functions**: Implement all game logic in Cloud Functions to:
   - Validate all game actions server-side
   - Prevent cheating by client-side manipulation
   - Ensure consistent game state for all players

3. **Player Hand Security**: Store player hands in separate documents with player-specific access controls

## Conclusion

This implementation plan provides a structured approach to developing the 28 card game with a clear separation between the core game logic and online functionality. By developing the game in phases, you can:

1. Create a fully functional offline version first
2. Test and refine the core game mechanics
3. Add online multiplayer features incrementally
4. Ensure the game works in both offline and online modes

This approach minimizes development risks and allows for early testing and feedback on the core gameplay before investing in the online infrastructure.
