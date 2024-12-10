const socket = io("https://common-verdant-boa.glitch.me/p2p"); // Replace with your signaling server URL if needed

const messageSound = new Audio("./sounds/message.mp3");
const notificationSound = new Audio("./sounds/notification.mp3");

let peerConnection;
let dataChannel;
let localSocketId;
let targetPeerId;
let replyContext;

const peerIdDisplay = document.getElementById("peerIdDisplay");
const connectionStatus = document.getElementById("connectionStatus");
const chatLog = document.getElementById("chatLog");
const sendButton = document.getElementById("sendButton");
const disconnectButton = document.getElementById("disconnectButton");

const generateIdButton = document.getElementById("generateIdButton");
const imageInput = document.getElementById("imageInput");

const welcomeScreen = document.getElementById("welcomeScreen");
const chatScreen = document.getElementById("chatScreen");
const chatInput = document.getElementById("chatInput");
const imagePreview = document.getElementById("imagePreview");
const chatBox = document.getElementById("chatBox");

socket.on("connect", () => {
    localSocketId = socket.id;
    peerIdDisplay.textContent = localSocketId;
    console.log("Connected to signaling server. Peer ID:", localSocketId);
});

generateIdButton.onclick = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

document.getElementById("connectButton").onclick = async () => {
    targetPeerId = document.getElementById("peerId").value.trim();
    if (!targetPeerId) {
        alert("Please enter a valid Peer ID!");
        return;
    }

    connectionStatus.textContent = "Connecting...";
    await createPeerConnection();

    dataChannel = peerConnection.createDataChannel("chat");
    setupDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("Sending offer:", offer);
    socket.emit("signal", { target: targetPeerId, signal: { offer } });
};

disconnectButton.onclick = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    connectionStatus.textContent = "Disconnected";
    sendButton.disabled = true;
    disconnectButton.disabled = true;
    chatInput.disabled = true;
    console.log("Disconnected from Peer");
};

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
                urls: "turn:relay.metered.ca:80",
                username: "user",
                credential: "pass"
            }
        ]
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Sending ICE candidate:", event.candidate);
            socket.emit("signal", { target: targetPeerId, signal: { candidate: event.candidate } });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
        if (peerConnection.connectionState === "connected") {
            connectionStatus.textContent = "Connected";
            disconnectButton.disabled = false;
        } else if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "failed") {
            connectionStatus.textContent = "Disconnected";
        }
    };

    peerConnection.ondatachannel = (event) => {
        console.log("DataChannel received:", event.channel);
        dataChannel = event.channel;
        setupDataChannel();
    };
}

function setupDataChannel() {
    dataChannel.onopen = () => {
        console.log("DataChannel is open!");
        chatInput.disabled = false;
        sendButton.disabled = false;
    };

    dataChannel.onclose = () => {
        console.log("DataChannel is closed.");
        chatInput.disabled = true;
        sendButton.disabled = true;
    };

    dataChannel.onmessage = (event) => {
        const message = event.data;
        console.log("Message received:", message);
        appendMessage(message, "peer");
    };
}



function triggerGlowEffect() {
    chatLog.classList.add("glow");

    // Remove the glow class after the animation ends
    setTimeout(() => {
        chatLog.classList.remove("glow");
    }, 300); // Match the transition duration in CSS
};




///// NEW FEATURES

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
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    // Add reply context if present
    let replyHTML = "";
    if (reply) {
        replyHTML = `<div class="reply"><strong>${reply.name}: </strong> ${reply.text || "an image"}</div>`;
    }

    messageDiv.innerHTML = `
        ${replyHTML}
        <strong>${name}:</strong> ${text}
        <img class="reply-button" src="../icons/reply.png" alt="Reply" onclick="setReplyContext('${name}', '${text}')"/>
    `;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function appendImage({ name, image, reply }, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    // Add reply context if present
    let replyHTML = "";
    if (reply) {
        replyHTML = `<div class="reply"><strong>Replying to ${reply.name}:</strong>&nbsp;${reply.text || "an image"}</div>`;
    }

    messageDiv.innerHTML = `
        ${replyHTML}
        <strong>${name}:</strong> <img src="${image}" alt="Image" style="max-width: 200px; max-height: 200px;">
        <img class="reply-button" src="../icons/reply.png" alt="Reply" onclick="setReplyContext('${name}', 'an image')"/>
    `;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Listen for incoming messages
socket.on("message", (data) => {
    appendMessage(data, data.name === socket.id ? "you" : "peer");
    if (data.name !== socket.id) {
        messageSound.play();
    }
});

socket.on("image", (data) => {
    appendImage(data, data.name === socket.id ? "you" : "peer");
    if (data.name !== socket.id) {
        messageSound.play();
    }
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

socket.on("signal", async ({ signal, sender }) => {
    console.log("Received signal:", signal, "from:", sender);

    if (signal.offer) {
        console.log("Received offer, creating answer...");
        await createPeerConnection();
        await peerConnection.setRemoteDescription(signal.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log("Sending answer:", answer);
        socket.emit("signal", { target: sender, signal: { answer } });
        targetPeerId = sender;
    } else if (signal.answer) {
        console.log("Received answer, setting remote description...");
        await peerConnection.setRemoteDescription(signal.answer);
    } else if (signal.candidate) {
        console.log("Received ICE candidate, adding...");
        await peerConnection.addIceCandidate(signal.candidate).catch(e => console.error(e));
    }
});

chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { // Check for Enter without Shift (to avoid adding a newline)
        event.preventDefault(); // Prevent default newline behavior
        sendButton.click(); // Trigger the Send button
    }
});
