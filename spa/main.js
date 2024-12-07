const socket = io("https://common-verdant-boa.glitch.me/spa");

const avatarImage = new Image();
avatarImage.src = "https://cdn.glitch.global/c44b5dde-8e2f-4e3d-8249-4f219cde050d/avatar.png?v=1733609208614"; // Path to your avatar image
const backgroundImage = new Image();
backgroundImage.src = "https://cdn.glitch.global/c44b5dde-8e2f-4e3d-8249-4f219cde050d/background.jpg?v=1733609211311"; // Path to your background image

avatarImage.onload = () => console.log("Avatar loaded successfully");
avatarImage.onerror = () => console.error("Failed to load avatar image");

backgroundImage.onload = () => console.log("Background loaded successfully");
backgroundImage.onerror = () => console.error("Failed to load background image");


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

let players = {};
let myPlayer = { x: 250, y: 250, message: "" };

// Handle resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 50; // Leave space for chat box
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const backgroundMusic = new Audio("./music/background.mp3");
backgroundMusic.loop = true; // Loop the music
backgroundMusic.volume = 0.5; // Adjust volume (0.0 to 1.0)

// Create play/pause toggle
const musicControl = document.createElement("button");
musicControl.textContent = "Play Music";
musicControl.style.position = "absolute";
musicControl.style.bottom = "60px";
musicControl.style.left = "10px";
musicControl.style.zIndex = 1000;
document.body.appendChild(musicControl);

let isPlaying = false;

musicControl.addEventListener("click", () => {
    if (isPlaying) {
        backgroundMusic.pause();
        musicControl.textContent = "Play Music";
    } else {
        backgroundMusic.play().catch((error) => {
            console.error("Failed to play music:", error);
        });
        musicControl.textContent = "Pause Music";
    }
    isPlaying = !isPlaying;
});

// Start music when user interacts with the page
window.addEventListener("click", () => {
    if (!isPlaying) {
        backgroundMusic.play().catch((error) => {
            console.error("Failed to start music on interaction:", error);
        });
        isPlaying = true;
        musicControl.textContent = "Pause Music";
    }
}, { once: true });

// Draw players on the canvas




function draw() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw players
    for (const id in players) {
        const player = players[id];

        // Draw avatar
        if (avatarImage.complete) {
            ctx.drawImage(avatarImage, player.x - 25, player.y - 25, 60, 60); // Adjust size as needed
        }

        // Draw player's name above the avatar
        ctx.fillStyle = "white"; // Text color
        ctx.strokeStyle = "black"; // Outline color
        ctx.lineWidth = 2; // Thickness of the outline
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";

        ctx.strokeText(player.name, player.x, player.y - 30); // Name above
        ctx.fillText(player.name, player.x, player.y - 30);

        // Draw player's message below the avatar
        if (player.message) {
            ctx.strokeText(player.message, player.x, player.y + 50); // Message below
            ctx.fillText(player.message, player.x, player.y + 50);
        }
    }

    requestAnimationFrame(draw);
}


draw();


// Handle player movement
window.addEventListener("keydown", (e) => {
    const moveDistance = 10; // Define how much the player moves with each key press

    // Arrow keys
    if (e.key === "ArrowUp") myPlayer.y -= moveDistance;
    if (e.key === "ArrowDown") myPlayer.y += moveDistance;
    if (e.key === "ArrowLeft") myPlayer.x -= moveDistance;
    if (e.key === "ArrowRight") myPlayer.x += moveDistance;

    // W, A, S, D keys
    if (e.key === "w" || e.key === "W") myPlayer.y -= moveDistance; // W
    if (e.key === "s" || e.key === "S") myPlayer.y += moveDistance; // S
    if (e.key === "a" || e.key === "A") myPlayer.x -= moveDistance; // A
    if (e.key === "d" || e.key === "D") myPlayer.x += moveDistance; // D

    // Emit movement to the server
    socket.emit("move", { x: myPlayer.x, y: myPlayer.y });
});


// Handle chat messages
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submission or newline
        sendMessage();
    }
});

sendButton.onclick = () => sendMessage();

function sendMessage() {
    const text = chatInput.value.trim();
    if (text) {
        socket.emit("message", { text });
        chatInput.value = ""; // Clear input
        chatInput.focus(); // Keep focus for typing
    }
    draw();
}

// Listen for the state-updated event
socket.on("state-updated", () => {
    console.log("State updated, redrawing canvas...");
    draw(); // Explicitly call the draw function
});

// Update players
socket.on("players", (data) => (players = data));
socket.on("player-joined", (data) => (players[data.id] = data));
socket.on("player-moved", (data) => (players[data.id] = data));

socket.on("message", (data) => {
    console.log("Received player-message:", data); // Debug log
    if (players[data.id]) {
        players[data.id].message = data.text; // Update the player's message
        console.log(`Player ${data.id} message updated to: ${data.text}`); // Confirm update
    } else {
        console.log(`Player ${data.id} not found!`); // If the player doesn't exist, log an error
    }
});

socket.on("player-left", (data) => delete players[data.id]);
