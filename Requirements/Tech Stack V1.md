# Tech Stack for 28 Card Game

## Frontend (Client-Side)

### Core Framework
- **React**:  The primary library for building the user interface.
- **Project Setup**: Vite or  for bootstrapping the React application, providing a development server, build process, and optimizations.
- **Language**: TypeScript - Highly recommended for type safety, better developer experience, and catching errors early in a complex application like a game.

### State Management
- **Zustand**: For managing global application state, such as user authentication status, current game state (scores, bids, hands, current turn), lobby information, and user profiles.
  - Zustand is often simpler for many use cases

### UI Components & Styling
- **Component Library**: Chakra UI. These provide pre-built, customizable components (Buttons, Modals, Cards, Inputs, Layout Grids) to speed up UI development and ensure consistency.

### Routing
- **React Router**: For handling navigation between different parts of the application (e.g., Login page, Lobby browser, Game screen, Profile page).

### Real-time Communication
- **Firebase Realtime Database SDK or Firestore SDK**: The client-side SDKs will be used to listen for real-time updates to game state, chat messages, and lobby changes directly from Firebase.

### Animations
- **Framer Motion or React Spring**: To add smooth animations for card dealing, playing, trick collection, and other UI transitions, enhancing the user experience.

## Backend (Firebase - BaaS)

### Authentication
- **Firebase Authentication**: To handle user registration (Email/Password, Google, etc.), login, and secure session management. It integrates seamlessly with other Firebase services.

### Database
*(Consider a hybrid approach or choose one based on priority)*

- **Firebase Realtime Database (RTDB)**: Ideal for the core real-time aspects of the game.
  - **Use Cases**: Storing and synchronizing active game state (current hands, bids, folded trump card status/suit, cards played in the current trick, whose turn it is), player presence in a game room, and in-game chat messages. Its low-latency synchronization is crucial for smooth gameplay.

- **Cloud Firestore**: A NoSQL document database suitable for more structured data and complex queries.
  - **Use Cases**: Storing user profiles (stats, game history, friends list), lobby/room metadata (available games, player counts), leaderboards, and potentially storing completed game logs. Offers more robust querying capabilities than RTDB.

- **Recommendation**: Use RTDB for the live game state and chat due to its low latency. Use Firestore for user data, game history, matchmaking information, and leaderboards.

### Server-Side Logic
- **Cloud Functions for Firebase**: This is critical for implementing the game's rules and logic securely on the server. Running logic client-side would make the game easily cheat-able.
  - **Use Cases**:
    - **Game Setup**: Shuffling decks (correct deck based on player count), dealing cards in batches.
    - **Bidding Logic**: Validating bids based on rules (minimums, increments, honors), determining bidding round winners, managing the two-round process.
    - **Trump Logic**: Handling the selection and folding of the trump card, managing its reveal based on game rules.
    - **Gameplay Validation**: Enforcing rules like following suit, validating card plays, determining trick winners.
    - **Scoring**: Calculating points per trick, comparing final scores against the contract, updating game points based on the complex scoring rules (Round 1 vs Round 2 bids, Honors, 3p vs 4p stakes).
    - **State Transitions**: Managing turns, updating the game state in RTDB/Firestore after each valid action.
    - **Matchmaking**: Creating/joining rooms, starting games when full.
    - **Leaderboard Updates**: Aggregating scores and updating leaderboards in Firestore.

### Hosting
- **Firebase Hosting**: To easily deploy the React web application. Provides a global CDN, SSL certificates, and simple deployment via the Firebase CLI.

### Push Notifications
- **Firebase Cloud Messaging (FCM)**: To send notifications to users if that is required

### Storage
- **Cloud Storage for Firebase**: If you plan to allow user avatars or store other static assets beyond the core application code.

## Supporting Tools & Practices

### Version Control
- **Git** (hosted on GitHub, GitLab, Bitbucket). Essential for collaboration and tracking changes.

### Package Manager
- **Yarn**

### Testing
- **Frontend**: Jest, React Testing Library for unit and integration tests.
- **Backend**: Firebase Local Emulator Suite to test Cloud Functions, RTDB, Firestore, and Auth interactions locally before deploying.

### CI/CD
- **GitHub Actions**, GitLab CI, or Firebase CLI hooks integrated into your hosting setup to automate testing and deployment processes.