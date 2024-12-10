let replyContext = null;
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
const imagePreview = document.getElementById("imagePreview");

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

// Handle button click to send message
sendButton.onclick = () => {
    const message = chatInput.value.trim();
    const file = imageInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const imageData = reader.result; // Base64 encoded image
            socket.emit("image", { image: imageData, reply: replyContext });
            appendImage({ name: "You", image: imageData, reply: replyContext }, "you");

            // Clear the input and preview after sending
            imageInput.value = ""; // Reset file input
            imagePreview.style.display = "none"; // Hide the preview
            imagePreview.src = ""; // Clear the image source
            clearReplyContext();
        };
        reader.onerror = () => {
            console.error("Error reading .jpg file:", reader.error);
        };
        reader.readAsDataURL(file);
    } else if (message) {
        socket.emit("message", { text: message, reply: replyContext });
        appendMessage({ name: "You", text: message, reply: replyContext }, "you");
        chatInput.value = ""; // Clear the input
        chatInput.focus(); // Keep focus for typing
        clearReplyContext();
    } else {
        alert("Please type a message or choose an image to send!");
    }
};

// Append message to chat log
function appendMessage({ name, text, reply }, sender) {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.className = `message-wrapper ${sender}`;
    wrapperDiv.style.display = "flex";
    wrapperDiv.style.alignItems = "center";
    wrapperDiv.style.justifyContent = sender === "you" ? "flex-end" : "flex-start"; // Align based on sender

    // Create the message bubble
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        ${reply ? `<div class="reply"><strong>${reply.name}: </strong> ${reply.text || "an image"}</div>` : ""}
        <strong>${name}:</strong> ${text}
    `;

    // Create the reply button
    const replyButton = document.createElement("img");
    replyButton.className = "reply-button";
    replyButton.src = "../icons/reply.png";
    replyButton.alt = "Reply";
    replyButton.onclick = () => setReplyContext(name, text);

    // Append message bubble and button to wrapper
    wrapperDiv.appendChild(messageDiv);
    wrapperDiv.appendChild(replyButton);

    // Append the wrapper to the chat log
    chatLog.appendChild(wrapperDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}


function appendImage({ name, image, reply }, sender) {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.className = `message-wrapper ${sender}`;
    wrapperDiv.style.display = "flex";
    wrapperDiv.style.alignItems = "center";
    wrapperDiv.style.justifyContent = sender === "you" ? "flex-end" : "flex-start"; // Align based on sender

    // Create the message bubble
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        ${reply ? `<div class="reply"><strong>Replying to ${reply.name}:</strong>&nbsp;${reply.text || "an image"}</div>` : ""}
        <strong>${name}:</strong> <img src="${image}" alt="Image" style="max-width: 200px; max-height: 200px;">
    `;

    // Create the reply button
    const replyButton = document.createElement("img");
    replyButton.className = "reply-button";
    replyButton.src = "../icons/reply.png";
    replyButton.alt = "Reply";
    replyButton.onclick = () => setReplyContext(name, "an image");

    // Append message bubble and button to wrapper
    wrapperDiv.appendChild(messageDiv);
    wrapperDiv.appendChild(replyButton);

    // Append the wrapper to the chat log
    chatLog.appendChild(wrapperDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Listen for incoming messages
socket.on("message", (data) => {
    appendMessage(data, data.name === displayName ? "you" : "peer");
    if (data.name !== displayName) {
        messageSound.play();
    }
});

socket.on("image", (data) => {
    appendImage(data, data.name === displayName ? "you" : "peer");
    if (data.name !== displayName) {
        messageSound.play();
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



// Listen for incoming images





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



function setReplyContext(name, text) {
    replyContext = { name, text };

    // Select the correct parent container (e.g., #chatContainer)
    const chatContainer = document.getElementById("replyPos");

    // Get or create the reply indicator
    let replyIndicator = document.getElementById("replyIndicator");
    if (!replyIndicator) {
        // Create the reply indicator if it doesn't exist
        replyIndicator = document.createElement("div");
        replyIndicator.id = "replyIndicator";
        chatContainer.insertBefore(replyIndicator, chatContainer.firstChild); // Insert at the top of the container
    }

    // Update the reply indicator content
    replyIndicator.style.display = "flex";
    replyIndicator.innerHTML = `
        Replying to ${name} "${text}"
        <button onclick="clearReplyContext()">Cancel</button>
    `;
}




function clearReplyContext() {
    replyContext = null;
    const replyIndicator = document.getElementById("replyIndicator");
    if (replyIndicator) replyIndicator.remove();
}

chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { // Check for Enter without Shift (to avoid adding a newline)
        event.preventDefault(); // Prevent default newline behavior
        sendButton.click(); // Trigger the Send button
    }
});
