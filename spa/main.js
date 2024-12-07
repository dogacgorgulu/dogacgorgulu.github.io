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

// Draw players on the canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const id in players) {
        const player = players[id];
        ctx.fillStyle = id === socket.id ? "blue" : "black";
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw name and message
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(player.name, player.x - 20, player.y - 15);
        if (player.message) {
            ctx.fillText(player.message, player.x - 20, player.y + 25);
        }
    }
    requestAnimationFrame(draw);
}
draw();

// Handle player movement
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") myPlayer.y -= 10;
    if (e.key === "ArrowDown") myPlayer.y += 10;
    if (e.key === "ArrowLeft") myPlayer.x -= 10;
    if (e.key === "ArrowRight") myPlayer.x += 10;
    socket.emit("move", { x: myPlayer.x, y: myPlayer.y });
});

// Handle chat messages
sendButton.onclick = () => {
    const text = chatInput.value.trim();
    if (text) {
        socket.emit("message", { text });
        chatInput.value = "";
    }
};

// Update players
socket.on("players", (data) => (players = data));
socket.on("player-joined", (data) => (players[data.id] = data));
socket.on("player-moved", (data) => (players[data.id] = data));
socket.on("player-message", (data) => (players[data.id] = data));
socket.on("player-left", (data) => delete players[data.id]);
