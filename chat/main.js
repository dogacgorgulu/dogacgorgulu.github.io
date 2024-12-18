const socket = io("https://common-verdant-boa.glitch.me/p2p"); // Replace with your signaling server URL

let peerConnection;
let dataChannel;
let targetPeerId;
let localSocketId;
let replyContext;

const chatLog = document.getElementById("chatLog");
const sendButton = document.getElementById("sendButton");
const disconnectButton = document.getElementById("disconnectButton");
const chatInput = document.getElementById("chatInput");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const replyIndicator = document.getElementById("replyIndicator");

const messageSound = new Audio("./sounds/message.mp3");
const notificationSound = new Audio("./sounds/notification.mp3");

// Connect to signaling server
socket.on("connect", () => {
  localSocketId = socket.id;
  peerIdDisplay.textContent = localSocketId;
  console.log("Connected to signaling server. Peer ID:", localSocketId);
});

// Handle signaling
socket.on("signal", async ({ signal, sender }) => {
  console.log("Received signal:", signal, "from:", sender);

  if (signal.offer) {
    console.log("Received offer, creating answer...");
    await createPeerConnection();
    await peerConnection.setRemoteDescription(signal.offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("Sending answer...");
    socket.emit("signal", { target: sender, signal: { answer } });

    targetPeerId = sender;
  } else if (signal.answer) {
    console.log("Received answer, setting remote description...");
    await peerConnection.setRemoteDescription(signal.answer);
  } else if (signal.candidate) {
    console.log("Received ICE candidate, adding...");
    await peerConnection.addIceCandidate(signal.candidate);
  }
});

// Create WebRTC connection
async function createPeerConnection() {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "turn:relay.metered.ca:80", username: "user", credential: "pass" }
    ]
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate...");
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

// Set up DataChannel
function setupDataChannel() {
  dataChannel.onopen = () => {
    console.log("DataChannel open!");
    chatInput.disabled = false;
    sendButton.disabled = false;
  };

  dataChannel.onclose = () => {
    console.log("DataChannel closed.");
    chatInput.disabled = true;
    sendButton.disabled = true;
  };

  dataChannel.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "text") {
      appendMessage({ name: "Peer", text: message.content, reply: message.reply }, "peer");
      notificationSound.play();
    } else if (message.type === "image") {
      appendImage({ name: "Peer", image: message.content, reply: message.reply }, "peer");
      messageSound.play();
    }
  };
}

// Initiate a connection
document.getElementById("connectButton").onclick = async () => {
  targetPeerId = document.getElementById("peerId").value.trim();
  if (!targetPeerId) {
    alert("Enter a valid Peer ID!");
    return;
  }

  connectionStatus.textContent = "Connecting...";
  await createPeerConnection();

  dataChannel = peerConnection.createDataChannel("chat");
  setupDataChannel();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log("Sending offer...");
  socket.emit("signal", { target: targetPeerId, signal: { offer } });
};

// Disconnect
disconnectButton.onclick = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  console.log("Disconnected from peer.");
};

// Send messages or images via DataChannel
sendButton.onclick = () => {
  const text = chatInput.value.trim();
  const file = imageInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      const message = { type: "image", content: imageData, reply: replyContext };
      dataChannel.send(JSON.stringify(message));
      appendImage({ name: "You", image: imageData, reply: replyContext }, "you");
      clearReplyContext();
    };
    reader.readAsDataURL(file);
  } else if (text) {
    const message = { type: "text", content: text, reply: replyContext };
    dataChannel.send(JSON.stringify(message));
    appendMessage({ name: "You", text, reply: replyContext }, "you");
    chatInput.value = "";
    clearReplyContext();
  } else {
    alert("Please type a message or choose an image to send!");
  }
};

// Append message
function appendMessage({ name, text, reply }, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  let replyHTML = "";
  if (reply) {
    replyHTML = `<div class="reply"><strong>${reply.name}:</strong> ${reply.text || "an image"}</div>`;
  }

  messageDiv.innerHTML = `
    ${replyHTML}
    <strong>${name}:</strong> ${text}
    <button onclick="setReplyContext('${name}', '${text}')">Reply</button>
  `;
  chatLog.appendChild(messageDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Append image
function appendImage({ name, image, reply }, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  let replyHTML = "";
  if (reply) {
    replyHTML = `<div class="reply"><strong>${reply.name}:</strong> ${reply.text || "an image"}</div>`;
  }

  messageDiv.innerHTML = `
    ${replyHTML}
    <strong>${name}:</strong> <img src="${image}" style="max-width: 200px;">
    <button onclick="setReplyContext('${name}', 'an image')">Reply</button>
  `;
  chatLog.appendChild(messageDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Set reply context
function setReplyContext(name, text) {
  replyContext = { name, text };
  replyIndicator.style.display = "flex";
  replyIndicator.textContent = `Replying to ${name}: "${text}"`;
}

// Clear reply context
function clearReplyContext() {
  replyContext = null;
  replyIndicator.style.display = "none";
}

// Preview selected image
imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
};
