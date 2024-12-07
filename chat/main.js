const socket = io("https://common-verdant-boa.glitch.me/p2p"); // Replace with your signaling server URL if needed

let peerConnection;
let dataChannel;
let localSocketId;
let targetPeerId;

const peerIdDisplay = document.getElementById("peerIdDisplay");
const connectionStatus = document.getElementById("connectionStatus");
const chatLog = document.getElementById("chatLog");
const sendButton = document.getElementById("sendButton");
const disconnectButton = document.getElementById("disconnectButton");
const messageBox = document.getElementById("messageBox");
const generateIdButton = document.getElementById("generateIdButton");

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
    messageBox.disabled = true;
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
        messageBox.disabled = false;
        sendButton.disabled = false;
    };

    dataChannel.onclose = () => {
        console.log("DataChannel is closed.");
        messageBox.disabled = true;
        sendButton.disabled = true;
    };

    dataChannel.onmessage = (event) => {
        const message = event.data;
        console.log("Message received:", message);
        appendMessage(message, "peer");
    };
}

sendButton.onclick = () => {
    const message = messageBox.value.trim();
    if (message && dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(message); // Send the message
        appendMessage(message, "you"); // Display the message in the chat log
        messageBox.value = ""; // Clear the textarea
        messageBox.focus(); // Keep the keyboard open
    } else {
        console.error("DataChannel is not open. Current state:", dataChannel ? dataChannel.readyState : "no dataChannel");
    }
};

function triggerGlowEffect() {
    chatLog.classList.add("glow");

    // Remove the glow class after the animation ends
    setTimeout(() => {
        chatLog.classList.remove("glow");
    }, 300); // Match the transition duration in CSS
};

function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;

    // Append the new message to the chat log
    chatLog.appendChild(msgDiv);

    // Auto-scroll to the bottom
    chatLog.scrollTop = chatLog.scrollHeight;

    // Trigger glow effect
    triggerGlowEffect();
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

// Add event listener to messageBox for the Enter key
messageBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent newline in the messageBox
        sendButton.onclick(); // Trigger the sendButton click event
    }
});
