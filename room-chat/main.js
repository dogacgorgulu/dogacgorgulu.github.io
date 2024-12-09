// Load audio files
const messageSound = new Audio("./sounds/message.mp3");
const notificationSound = new Audio("./sounds/notification.mp3");

const socket = io("https://common-verdant-boa.glitch.me/broadcast");

const welcomeScreen = document.getElementById("welcomeScreen");
const chatScreen = document.getElementById("chatScreen");
const displayNameInput = document.getElementById("displayNameInput");
const joinButton = document.getElementById("joinButton");
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");

const chatBox = document.getElementById("chatBox");
const userCountDisplay = document.getElementById("userCount");

let displayName = "";

// Join the chatroom
joinButton.onclick = () => {
    const name = displayNameInput.value.trim();
    if (!name) {
        alert("Please enter a display name!");
        return;
    }
    displayName = name;
    socket.emit("join", displayName); // Notify server of the new user

    // Toggle screens
    welcomeScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
};

// Listen for Enter key to send message
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent newline
        sendMessage();
    }
});

// Handle button click to send message
sendButton.onclick = () => sendMessage();

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("message", { text: message }); // Send message to server
        appendMessage({ name: "You", text: message }, "you"); // Append locally
        chatInput.value = ""; // Clear input
        chatInput.focus(); // Keep focus for quick typing
    }
}

// Append message to chat log
function appendMessage({ name, text }, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<strong>${name}:</strong> ${text}`;
    chatLog.appendChild(messageDiv);

    // Auto-scroll to the bottom
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Listen for incoming messages
socket.on("message", (data) => {
    if (data.name !== displayName) {
        appendMessage(data, "peer");
        messageSound.play(); // Play incoming message sound
    }
});

// Display system messages (e.g., join/leave notifications)
socket.on("system", (message) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "system-message";
    messageDiv.textContent = message;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    notificationSound.play(); // Play notification sound
});



// Listen for the userCount event
socket.on("userCount", (count) => {
    userCountNumber.textContent = count;
});

// Adjust the chatBox's position dynamically when the viewport height changes (mobile keyboard opens)
window.addEventListener("resize", () => {
    const viewportHeight = window.innerHeight;
    const totalHeight = window.outerHeight;

    if (viewportHeight < totalHeight * 0.7) {
        // Mobile keyboard is likely open
        chatBox.style.position = "absolute";
        chatBox.style.bottom = "0";
    } else {
        // Restore default behavior when keyboard is closed
        chatBox.style.position = "relative";
        chatBox.style.bottom = "auto";
    }
});


// image 

const imageInput = document.getElementById("imageInput");
const sendImageButton = document.getElementById("sendImageButton");

sendImageButton.onclick = () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const imageData = reader.result; // Base64 encoded image
            socket.emit("image", { image: imageData }); // Send image data to server
            appendImage({ name: "You", image: imageData }, "you"); // Append locally

            // Clear the input and preview after sending
            imageInput.value = ""; // Reset file input
            imagePreview.style.display = "none"; // Hide the preview
            imagePreview.src = ""; // Clear the image source
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please select an image to send!");
    }
};


function appendImage({ name, image }, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<strong>${name}:</strong> <img src="${image}" alt="Image" style="max-width: 200px; max-height: 200px;">`;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Listen for incoming images
socket.on("image", (data) => {
    if (data.name !== displayName) {
        appendImage(data, "peer");
        messageSound.play(); // Play incoming message sound
    }
});

const imagePreview = document.getElementById("imagePreview");



imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (file) {
        // Update and display the image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result; // Set the preview image source
            imagePreview.style.display = "block"; // Show the image
        };
        reader.readAsDataURL(file);
    } else {
        // Hide the preview if no file is selected
        imagePreview.style.display = "none";
        imagePreview.src = ""; // Clear the image source
    }
});

