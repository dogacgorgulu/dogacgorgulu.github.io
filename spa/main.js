const socket = io("https://common-verdant-boa.glitch.me/spa");

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
const avatarImage = new Image();
avatarImage.src = "./images/avatar.png"; // Path to your avatar image
const backgroundImage = new Image();
backgroundImage.src = "./images/background.jpg"; // Path to your background image

function draw() {
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        backgroundImage.onload = () => {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        };
    }

    for (const id in players) {
        const player = players[id];

        // Draw avatar
        if (avatarImage.complete) {
            ctx.drawImage(avatarImage, player.x - 15, player.y - 15, 30, 30); // Adjust size as needed
        } else {
            avatarImage.onload = () => {
                ctx.drawImage(avatarImage, player.x - 15, player.y - 15, 30, 30);
            };
        }

        // Draw name and message
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(player.name, player.x - 20, player.y - 25);
        if (player.message) {
            ctx.fillText(player.message, player.x - 20, player.y + 35);
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
}


// Update players
socket.on("players", (data) => (players = data));
socket.on("player-joined", (data) => (players[data.id] = data));
socket.on("player-moved", (data) => (players[data.id] = data));
socket.on("player-message", (data) => (players[data.id] = data));
socket.on("player-left", (data) => delete players[data.id]);
