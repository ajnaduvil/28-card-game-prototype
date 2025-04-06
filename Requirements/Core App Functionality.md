# Core Application Functionality

This document outlines the core functionality required for the 28 online multiplayer game, incorporating details from initial brainstorming and aligning with the comprehensive rules defined in `Rules/Rules-V3.md`. It assumes the use of Firebase (Auth, Firestore, Cloud Functions) for the backend.

**1. User Authentication & Profile Management**

*   **Registration:**
    *   Provide a dedicated registration screen/modal.
    *   Support Email/Password and potentially Google Sign-in (Firebase Authentication).
    *   Include client-side input validation (email format, password strength).
    *   Require a unique, checked Display Name.
    *   Allow users to select an Avatar (image representation).
    *   On success (Firebase Auth), create a user profile document in Firestore (`users` collection) storing `userId` (Auth UID), `displayName`, and `avatarUrl`.
    *   Provide clear error feedback (e.g., "Email already in use", "Weak password", "Display name taken").
*   **Login:**
    *   Provide a dedicated login screen/modal matching registration methods.
    *   Use Firebase Auth for credential verification.
    *   Provide clear error feedback (e.g., "Invalid credentials", "User not found").
*   **Session Management:**
    *   Utilize Firebase Auth SDK for session persistence (e.g., browser local storage/indexedDB).
    *   Ensure the UI consistently reflects the logged-in state (display name, avatar, available actions).
*   **Profile:**
    *   A basic profile view displaying `displayName` and `avatarUrl`. (Future: basic stats like games played/won).
*   **Logout:**
    *   Provide a clear logout button (e.g., in a user menu).
    *   Call Firebase Auth `signOut()`.
    *   Redirect to the login screen or a public landing page.

**2. Main Menu / Lobby & Matchmaking**

*   **Access:** Restricted to authenticated users; typically the default screen post-login.
*   **Available Games List:**
    *   Display a dynamic list of games with `status: 'waiting'`, fetched via a real-time Firestore query (`onSnapshot` on the `games` collection).
    *   Each item must clearly show:
        *   Host's `displayName`.
        *   Game Mode (3-Player / 4-Player).
        *   Current Player Count / Target Player Count (e.g., "1/3", "2/4").
        *   (Optional) Game creation timestamp or relative time.
    *   The list updates automatically as games are created, players join/leave, or games start.
*   **Create Game Action:**
    *   Include a prominent "Create Game" button.
    *   Opens a modal/form to select Game Mode (3-Player or 4-Player).
    *   Submitting triggers a `createGame` Cloud Function, passing mode and user context (UID, display name).
    *   On success (function returns `gameId`), automatically navigate the creator to the Waiting Room for that `gameId`.
    *   Handle potential function errors gracefully.
*   **Join Game Action:**
    *   Allow users to click on a game in the list.
    *   Triggers a `joinGame` Cloud Function, passing `gameId` and user context.
    *   Cloud Function performs server-side validation: game exists, `status` is 'waiting', game not full, user not already joined.
    *   On success, automatically navigate the user to the Waiting Room for that `gameId`.
    *   Provide clear feedback on failure (e.g., "Game is full", "Game has started").

**3. Pre-Game Waiting Room**

*   **Entry:** Automatic after creating or successfully joining a game.
*   **Real-time Player List:**
    *   Subscribe (`onSnapshot`) to the specific `games/{gameId}` document.
    *   Display the `displayName` (and potentially avatar) of each player in the `players` array.
    *   Update instantly as players join or leave.
*   **Status Display:** Show "Waiting for X more player(s)..." based on `playerCountTarget` vs current `players.length`.
*   **Team Preview (4-Player):** If `playerCountTarget` is 4, visually group players based on join order (Player 1 & 3 vs Player 2 & 4).
*   **Leave Room:**
    *   Provide a "Leave Game" button.
    *   Triggers a `leaveGame` Cloud Function to remove the player from the `players` array (if game status is `waiting`).
    *   Handle host leaving (potential game cancellation logic in the Cloud Function).
    *   Navigate the user back to the Lobby on successful leave.
*   **Automatic Game Start:**
    *   No explicit "Start" button required.
    *   A Cloud Function (triggered by `onUpdate` on the game document or within `joinGame`) detects when `players.length === playerCountTarget`.
    *   This function initiates the first round setup:
        *   Selects the appropriate deck (24 cards for 3p, 32 cards for 4p).
        *   Securely shuffles the deck server-side.
        *   Determines initial `dealerIndex` and `originalBidderIndex` (player to dealer's right).
        *   Deals the first batch (4 cards) to each player.
        *   Writes hands securely to separate `playerHands/{gameId}/{playerId}` documents (Firestore rules essential).
        *   Sets game `status` to `bidding1`.
        *   Sets `currentTurnIndex` to the `originalBidderIndex`.
        *   Updates the main `games/{gameId}` document.
*   **Transition:** The client's `onSnapshot` listener detects the `status` change to `bidding1`, triggering navigation to the Gameplay Screen for all players.

**4. Gameplay Screen & Interactions**

*   **Layout & Rendering:**
    *   Subscribe (`onSnapshot`) to `games/{gameId}` and the user's `playerHands/{gameId}/{playerId}`.
    *   Render a clear table layout: player positions (with display names/avatars), score areas, current trick area, folded card area.
    *   Display the user's hand clearly (clickable cards showing suit/rank).
    *   Show opponents' positions, card counts (backs), and display names/avatars.
    *   Clearly indicate the active player (`currentTurnIndex`) and current game phase (`status`: `bidding1`, `dealing2`, `bidding2`, `trump_selection_provisional`, `trump_selection_final`, `playing`, `round_over`, `game_over`).
    *   Display the current `dealerIndex` and `originalBidderIndex`.
*   **Bidding Phase (Rounds 1 & 2):**
    *   If `status` is `bidding1` or `bidding2` and it's the user's turn:
        *   Enable bidding controls (number input, quick bid buttons [e.g., +1, +2], "Pass" button, potentially "Honors" button if applicable in Round 1).
        *   Display the current highest bid, the bidder, and the minimum next bid.
        *   Client-side validation: bid is numeric, > current highest, within 14-28 range, meets Round 2 minimums (22 for 3p, 24 for 4p). Define Round 1 "Honors" threshold (>18 for 3p, >20 for 4p).
        *   Submitting a bid calls `submitBid` Cloud Function (`gameId`, `bidAmount`).
        *   Passing calls `passBid` Cloud Function (`gameId`).
        *   Cloud Functions perform authoritative validation, update game state (`bids`, `highestBid`, `highestBidderIndex`, `currentTurnIndex`, potentially `status` to `dealing2` or `trump_selection_provisional`/`final`).
        *   Display a log/history of bids made in the current round.
*   **Dealing Phase (Round 2):**
    *   After Round 1 bidding concludes, the backend deals the remaining 4 cards.
    *   Cloud function updates `playerHands` and sets `status` to `bidding2` (or `trump_selection_final` if R1 bid was high enough or everyone passed R2).
    *   Client UI updates hand displays.
*   **Trump Selection Phase:**
    *   **Provisional (After Round 1 Bid Win):**
        *   If `status` is `trump_selection_provisional` and user is Bidder 1:
        *   Present UI showing their initial 4 cards.
        *   Allow selection of one card as the provisional folded trump.
        *   Action calls `selectProvisionalTrump` Cloud Function (`gameId`, `card`).
        *   Function validates, updates game state (stores folded card info securely, maybe in a private sub-collection), sets player's active card count to 3, sets `status` to `dealing2`.
    *   **Final (After Round 2 Bid Win / Conclusion):**
        *   If `status` is `trump_selection_final` and user is Final Declarer:
        *   Present UI showing their full 8-card hand (or 7+1 if they were Bidder 1 and kept Trump 1).
        *   If Declarer == Bidder 1: Offer choice "Keep Provisional Trump" or "Select New Trump".
        *   If Declarer != Bidder 1: Force selection of a new trump suit and card.
        *   Interface requires selecting the *suit* and the *specific card* to fold.
        *   Action calls `selectFinalTrump` Cloud Function (`gameId`, `card`, potentially `keepProvisional`).
        *   Function validates, updates game state (stores final folded card securely, updates trump suit, sets declarer's active card count to 7), sets `status` to `playing`.
    *   Display a face-down card placeholder in the designated folded trump area.
*   **Playing Phase:**
    *   If `status` is `playing` and it's the user's turn:
        *   Enable card selection in their hand.
        *   Client-side logic highlights playable cards based on `ledSuit`, hand contents, and `trumpSuit` (if revealed), following `Rules-V3.md`:
            *   Must follow suit if possible.
            *   If unable to follow suit:
                *   If user is **not** the Declarer: Can play any card (including trump, potentially triggering the "Ask Trump?" prompt if trump is unknown).
                *   If user **is** the Declarer: Can choose to play **either** a trump card (if available) **or** any card from another plain suit (a discard).
                    *   **If playing a trump card in this situation:** The UI must provide an additional choice: "Play (Keep Hidden)" or "Play & Reveal Trump".
            *   **Declarer playing Trump (General):** Whenever the declarer plays a card of the **trump suit** (either following a trump lead or choosing to ruff when unable to follow another suit) and the trump **is not yet revealed**, the UI must provide the choice: "Play (Keep Hidden)" or "Play & Reveal Trump".
        *   Clicking a valid card (or choosing an option for the Declarer's trump play) calls the appropriate action:
            *   Normal play / Declarer keeps hidden: Calls `playCard` Cloud Function (`gameId`, `card`).
            *   Declarer reveals: Calls `declarerRevealTrump` Cloud Function (`gameId`) **followed by** `playCard` Cloud Function (`gameId`, `card`).
        *   `playCard` Cloud Function performs authoritative validation (`isValidPlay`), updates `currentTrick`, updates player's hand, determines trick winner if trick complete, updates scores/tricks won, advances `currentTurnIndex`, and potentially sets `status` to `round_over` if last trick. **It no longer automatically reveals trump.**
        *   `declarerRevealTrump` Cloud Function: Validates the request (is declarer, trump not revealed), sets `trumpRevealed: true`, and handles returning the folded card to the declarer's hand data.
    *   Animate played cards moving to the center trick area.
    *   Update opponent card counts.
*   **Trump Reveal Mechanism:**
    *   If a non-declarer cannot follow suit (client-side check):
        *   Enable an "Ask Trump?" button.
        *   Clicking calls `requestTrumpReveal` Cloud Function (`gameId`).
        *   Function validates request, sets `trumpRevealed: true`, reveals `trumpSuit` in game state, and potentially adds folded card back to declarer's hand data (adjusting count).
    *   UI reacts to `trumpRevealed` flag: displays the trump suit indicator, potentially shows the revealed folded card visually (briefly or persistently?).
    *   Declarer implicitly reveals by playing trump when unable to follow suit (handled by `playCard` function). -> **REMOVED: Declarer reveal is now explicit.**
*   **Real-time Updates:** All relevant UI elements (scores, tricks won, player hand counts, current trick, turn indicator, revealed trump, game status) update reactively based on Firestore `onSnapshot` data.
*   **Trick Collection:** Animate the winning player collecting the cards. Store won tricks visually (e.g., a pile near the player).

**5. Round End & Game End Flow**

*   **Round End Trigger:** `playCard` Cloud Function detects the 8th trick completion.
*   **Scoring Calculation (Server-Side):**
    *   Function calculates points captured per side (J=3, 9=2, A=1, 10=1).
    *   Compares declarer's side score to the `finalContract`.
    *   Determines Game Points awarded/lost based on `Rules-V3.md` (Round 1/2 bid, Honors, 3p/4p differences). Consider optional "Coat" rule implementation?
*   **State Update (Server-Side):**
    *   Update cumulative `gameScores`.
    *   Set `status` to `round_over`.
    *   Populate `lastRoundResult` (declarer, contract, points scored, game points change).
*   **UI Display (Round Over):**
    *   Detect `status == 'round_over'`.
    *   Display a summary modal showing `lastRoundResult` clearly.
*   **Next Round Initiation:**
    *   Provide a "Start Next Round" button (active if game not over).
    *   Clicking calls `prepareNextRound` Cloud Function (`gameId`).
    *   Function:
        *   Resets round-specific state (bids, tricks, hands, `trumpRevealed`, `currentTrick`, etc.).
        *   Advances `dealerIndex` (clockwise).
        *   Recalculates `originalBidderIndex`.
        *   Shuffles deck, deals first 4 cards, updates `playerHands`.
        *   Sets `status` to `bidding1` and `currentTurnIndex` to `originalBidderIndex`.
*   **Game End Trigger (Server-Side):**
    *   After score calculation, the Cloud Function checks if `gameScores` reach the target (e.g., 6, 8, 12 - configurable?).
*   **State Update (Server-Side):**
    *   If target reached, set `status` to `game_over`.
    *   Store winner information (`winnerIndex` or `winningTeam`).
*   **UI Display (Game Over):**
    *   Detect `status == 'game_over'`.
    *   Display a final game over message declaring the winner(s) and final scores.
    *   Disable "Next Round" button, offer "Return to Lobby".

**6. General & Cross-Cutting Functionality**

*   **Error Handling:** Robust handling for Cloud Function errors (user-friendly messages), Firestore connectivity issues.
*   **Visual Feedback:** Consistent loading indicators, smooth animations (dealing, playing, collecting tricks), clear cues for active elements, turns, game state.
*   **Responsiveness:** Use responsive design principles (e.g., Tailwind CSS) for usability on various screen sizes, including good support for mobile landscape mode.
*   **Disconnection Handling:**
    *   Utilize Firestore's presence system or manual heartbeats (via periodic Cloud Function calls from client) to detect disconnections.
    *   Visually mark disconnected players in the UI.
    *   Implement server-side logic (Cloud Function triggered by presence change or missed heartbeat): If a player is disconnected for X duration (e.g., 60s) during their turn or critical phase, their team/they forfeit the round/game, or the game is cancelled. Update game state accordingly. Needs careful design to prevent abuse.
*   **Security:** Implement Firestore security rules to prevent unauthorized data access/modification (e.g., players seeing other hands, modifying game state directly). Cloud Functions provide the authoritative layer for game logic.