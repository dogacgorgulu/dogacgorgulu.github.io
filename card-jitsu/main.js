// Replace with your backend URL
const socket = io("https://common-verdant-boa.glitch.me/card-jitsu");

// UI elements
const statusDisplay = document.getElementById("status");
const joinButton = document.getElementById("join-button");
const sessionIdInput = document.getElementById("session-id");
const gameLog = document.getElementById("game-log");
const deckContainer = document.getElementById("deck-container");
const scoreDisplay = document.getElementById("score-display");

// Variables
let sessionId = null;
let playerDeck = [];
let currentTurnPlayer = null;

// Update connection status
socket.on("connect", () => {
    statusDisplay.textContent = "Connected";
    statusDisplay.style.color = "green";
    console.log("Connected to the server");
});

socket.on("disconnect", () => {
    statusDisplay.textContent = "Disconnected";
    statusDisplay.style.color = "red";
    console.log("Disconnected from the server");
});

// Handle errors
socket.on("connect_error", (error) => {
    statusDisplay.textContent = "Connection Error";
    statusDisplay.style.color = "red";
    console.error("Connection error:", error);
});

socket.on("error", (message) => {
    updateGameLog(`Error: ${message}`, "error");
    console.error("Error:", message);
});

// Handle session updates
socket.on("session-update", (data) => {
    updateGameLog(`Players in session: ${data.players.join(", ")}`);
    console.log("Session update:", data);
});

// Handle game started
socket.on("game-started", (data) => {
    playerDeck = data.decks[socket.id] || [];
    const defender = data.round === 1 ? data.players[0] : data.players[1];
    const attacker = data.round === 1 ? data.players[1] : data.players[0];

    updateGameLog(
        `Game started! ${defender === socket.id ? "You" : "Opponent"} are defending.`,
        "role-reversal"
    );
    updateGameLog(
        `${attacker === socket.id ? "You" : "Opponent"} are attacking.`,
        "role-reversal"
    );

    displayPlayerDeck();
    displayScores(data.scores, "Scores");
});

// Handle next turn
socket.on("next-turn", (data) => {
    currentTurnPlayer = data.player;
    if (socket.id === currentTurnPlayer) {
        updateGameLog("It's your turn! Play a card.");
        enableCardSelection();
    } else {
        updateGameLog(`Waiting for ${data.player} to play...`);
        disableCardSelection();
    }
});

// Handle card played
socket.on("card-played", (data) => {
    updateGameLog(`${data.player} played a card: ${data.card.element} (${data.card.power})`);
});

// Handle round result
socket.on("round-result", (data) => {
    const winnerText = data.winner
        ? `Turn winner: ${data.winner === socket.id ? "You" : "Opponent"}`
        : "It's a draw!";
    updateGameLog(winnerText);
    displayScores(data.scores, "Scores");
});

// Handle role reversal
socket.on("role-reversal", (data) => {
    const defender = data.newDefender === socket.id ? "You" : "Opponent";
    updateGameLog(`Round ${data.round} started! ${defender} are defending.`, "role-reversal");
    updateGameLog("Roles have been reversed. Prepare your strategy!", "role-reversal");
    displayScores(data.scores, "Scores");
});

// Handle game end
socket.on("game-ended", (data) => {
    if (data.reason) {
        updateGameLog(`Game ended: ${data.reason}`, "error");
    } else {
        const winnerText = data.winner === socket.id ? "You" : "Opponent";
        updateGameLog(`Game over! ${winnerText} are the overall winner!`, "game-end");
        updateGameLog("Final scores:");
        displayScores(data.scores, "Final Scores");
    }
    console.log("Game ended:", data);
});

// Join a game session
joinButton.addEventListener("click", () => {
    sessionId = sessionIdInput.value.trim();
    if (sessionId) {
        socket.emit("join-game", sessionId);
        updateGameLog(`Joining session ${sessionId}...`);
        console.log(`Attempting to join session ${sessionId}`);
    } else {
        updateGameLog("Please enter a session ID!", "error");
    }
});

// Enable card selection for the player's turn
function enableCardSelection() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
        card.disabled = false;
        card.addEventListener("click", handleCardPlay);
    });
}

// Disable card selection for the opponent's turn
function disableCardSelection() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
        card.disabled = true;
        card.removeEventListener("click", handleCardPlay);
    });
}

// Handle card play
function handleCardPlay(event) {
    const cardId = event.target.dataset.cardId;
    const card = playerDeck.find((c) => c.id === cardId);

    // If cardId is invalid or card not found, avoid processing further
    if (!card) {
        updateGameLog("Invalid card selection!", "error");
        return;
    }

    if (!card) {
        updateGameLog("Invalid card selection!", "error");
        return;
    }

    if (socket.id === currentTurnPlayer) {
        socket.emit("play-card", { sessionId, cardId: card.id });
        playerDeck = playerDeck.filter((c) => c.id !== cardId);
        displayPlayerDeck();
    }
}

// Display the player's deck
function displayPlayerDeck() {
    deckContainer.innerHTML = ""; // Clear previous deck

    playerDeck.forEach((card) => {
        const cardElement = document.createElement("button");
        cardElement.className = "card";
        cardElement.dataset.cardId = card.id;

        // Create the image element for the card
        const cardImage = document.createElement("img");
        cardImage.src = `card-art/${card.element.toLowerCase()}-${card.power}.png`;
        cardImage.alt = `${card.element} (${card.power})`;
        cardImage.className = "card-image";

        // Append the image and text to the button
        cardElement.appendChild(cardImage);
        cardElement.appendChild(document.createTextNode(`${card.element} (${card.power})`));

        // Add click event for playing the card
                // Add click event to the button, not the image
                cardElement.addEventListener("click", (event) => {
                    // Ensure only the button processes the event
                    event.preventDefault();
                    event.stopPropagation();
                    handleCardPlay(event.currentTarget.dataset.cardId); // Pass only the cardId
                });

        // Add the card to the deck container
        deckContainer.appendChild(cardElement);
    });
}

// Display scores
function displayScores(scores) {
    const yourScoreElement = document.getElementById("score-you");
    const opponentScoreElement = document.getElementById("score-opponent");

    // Update scores
    yourScoreElement.textContent = scores[socket.id] || 0; // "You" score
    const opponentId = Object.keys(scores).find((id) => id !== socket.id); // Find opponent ID
    opponentScoreElement.textContent = scores[opponentId] || 0; // "Opponent" score
}


// Helper function to update the game log
function updateGameLog(message, className = "") {
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    if (className) logEntry.classList.add(className);
    gameLog.appendChild(logEntry);
    gameLog.scrollTop = gameLog.scrollHeight;
}
