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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    for (const id in players) {
        const player = players[id];

        ctx.save(); // Save the current canvas state

        // Flip avatar if facing right
        if (player.lastDirection === "right") {
            ctx.translate(player.x + 25, player.y - 25); // Move to the avatar's position
            ctx.scale(-1, 1); // Flip horizontally
            ctx.translate(-(player.x + 25), -(player.y - 25)); // Move back
        }

        // Draw avatar (flipped if facing right)
        ctx.drawImage(avatarImage, player.x - 25, player.y - 25, 60, 60);

        ctx.restore(); // Restore the canvas state to avoid affecting other drawings

        // Draw player's name and message
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";

        ctx.strokeText(player.name, player.x, player.y - 35);
        ctx.fillText(player.name, player.x, player.y - 35);

        if (player.message) {
            ctx.strokeText(player.message, player.x, player.y + 60);
            ctx.fillText(player.message, player.x, player.y + 60);
        }
    }

    requestAnimationFrame(draw);
}



draw();


// Handle player movement
window.addEventListener("keydown", (e) => {
    let dx = 0, dy = 0;

    if (e.key === "ArrowUp" || e.key === "w") dy = -10;
    if (e.key === "ArrowDown" || e.key === "s") dy = 10;
    if (e.key === "ArrowLeft" || e.key === "a") {
        dx = -10;
        myPlayer.lastDirection = "left"; // Moving left
    }
    if (e.key === "ArrowRight" || e.key === "d") {
        dx = 10;
        myPlayer.lastDirection = "right"; // Moving right
    }

    myPlayer.x += dx;
    myPlayer.y += dy;

    socket.emit("move", { x: myPlayer.x, y: myPlayer.y, direction: myPlayer.lastDirection });
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

const chatLog = document.getElementById("chatLog");

socket.on("message", (data) => {
    if (players[data.id]) {
        players[data.id].message = data.text;

        // Create a new chat log entry
        const messageElement = document.createElement("div");
        messageElement.textContent = `${players[data.id].name}: ${data.text}`;
        messageElement.style.marginBottom = "5px";

        // Append the message to the chat log
        chatLog.appendChild(messageElement);

        // Auto-scroll to the bottom of the chat log
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});


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
