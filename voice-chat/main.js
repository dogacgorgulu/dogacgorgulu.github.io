const socket = io("https://common-verdant-boa.glitch.me/voice-chat");

let localStream;
let peerConnection;
let remoteAudio = document.getElementById("remoteAudio");
let hangUpButton = document.getElementById("hangUpCall");
const userList = document.getElementById("userList");
const refreshUsersButton = document.getElementById("refreshUsers");
const incomingCallDiv = document.getElementById("incomingCall");
const callerIdSpan = document.getElementById("callerId");
const answerCallButton = document.getElementById("answerCall");
const rejectCallButton = document.getElementById("rejectCall");
let currentPeerId = null;

const nameInput = document.getElementById("nameInput");
const setNameButton = document.getElementById("setName");
let myName = "";

const ringtoneAudio = document.getElementById("ringtone");
const toggleMuteButton = document.getElementById("toggleMute");
let isMuted = true;

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" }
];

let inCall = false;
let callPartnerName = "";
let isCalling = false;

async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.log("Media initialized:", localStream);
}

setNameButton.addEventListener("click", () => {
  const newName = nameInput.value.trim();
  if (newName !== "") {
    myName = newName;
    socket.emit("setName", newName);
  }
});

socket.on("userList", (users) => {
    console.log("Received user list:", users);
    userList.innerHTML = "";
    if (users.length === 0) {
        userList.innerHTML = "<p>No other users online.</p>";
        return;
    }
    users.forEach((user) => {
        const userElement = document.createElement("div");
        userElement.className = "user";
        userElement.innerHTML = `
            <span>User: ${user.name}</span>
            <button onclick="startCall('${user.id}')">Call</button>
        `;
        userList.appendChild(userElement);
    });
});

socket.on("playNotification", ({ from }) => {
  const notificationSound = document.getElementById("notificationSound");
  notificationSound.play();
  alert(`${from} sent you a notification!`);
});

toggleMuteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  ringtoneAudio.muted = isMuted;

  if (isMuted) {
    toggleMuteButton.textContent = "Unmute Ringtone";
  } else {
    toggleMuteButton.textContent = "Mute Ringtone";
  }
});

refreshUsersButton.addEventListener("click", () => {
  console.log("Requesting user list...");
  socket.emit("getUsers");
});

async function startCall(targetUserId) {
  console.log("Starting call with:", targetUserId);
  currentPeerId = targetUserId;

  await initMedia();
  await createPeerConnection();

  localStream.getTracks().forEach((track) => {
    console.log("Adding track:", track);
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", { target: targetUserId, offer });
  hangUpButton.disabled = false;
  inCall = true;
  isCalling = true;
  updateCallStatus();
}

socket.on("offer", async ({ offer, from }) => {
  console.log("Received offer from:", from);

  if (!isMuted) {
    ringtoneAudio.play();
  }

  currentPeerId = from.id;
  callerIdSpan.textContent = from.name;
  incomingCallDiv.style.display = "block";
  callPartnerName = from.name;

  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
});

answerCallButton.addEventListener("click", async () => {
  console.log("Answering call from:", currentPeerId);

  ringtoneAudio.pause();
  ringtoneAudio.currentTime = 0;

  await initMedia();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", { target: currentPeerId, answer });
  incomingCallDiv.style.display = "none";
  hangUpButton.disabled = false;
  isCalling = false;
  inCall = true;
  updateCallStatus();
});

rejectCallButton.addEventListener("click", () => {
  console.log("Rejected call from:", currentPeerId);

  ringtoneAudio.pause();
  ringtoneAudio.currentTime = 0;

  currentPeerId = null;
  incomingCallDiv.style.display = "none";
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
});

socket.on("answer", async ({ answer, from }) => {
  console.log("Received answer");
  await peerConnection.setRemoteDescription(answer);
  callPartnerName = from.name; // Get the callee's name
  isCalling = false;
  inCall = true; // Set inCall to true for the caller
  updateCallStatus(); // Update the caller's UI
});

socket.on("candidate", ({ candidate }) => {
  console.log("Received ICE candidate");
  peerConnection.addIceCandidate(candidate).catch(console.error);
});

async function createPeerConnection() {
  peerConnection = new RTCPeerConnection({ iceServers });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate:", event.candidate);
      socket.emit("candidate", { target: currentPeerId, candidate: event.candidate });
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("Received remote track:", event.streams[0]);
    remoteAudio.srcObject = event.streams[0];
  };
}

hangUpButton.addEventListener("click", hangUp);
async function hangUp() {
  if (peerConnection) {
    socket.emit("hangUp", currentPeerId);
    peerConnection.close();
    peerConnection = null;
    currentPeerId = null;
  }
  console.log("Call ended.");
  hangUpButton.disabled = true;
  inCall = false;
  isCalling = false;
  updateCallStatus();
}

socket.on("hangUp", () => {
  console.log("Remote user hung up.");
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    currentPeerId = null;
  }
  hangUpButton.disabled = true;
  inCall = false;
  isCalling = false;
  updateCallStatus();
});

function updateCallStatus() {
  const callStatusDiv = document.getElementById("callStatus");
  if (!callStatusDiv) {
    const newDiv = document.createElement("div");
    newDiv.id = "callStatus";
    document.body.appendChild(newDiv);
  }

  if (inCall) {
    document.getElementById("callStatus").textContent = `In call with ${callPartnerName}.`;
  } else {
    document.getElementById("callStatus").textContent = "Not in a call.";
  }

  if (isCalling) {
    document.getElementById("callStatus").textContent = `Calling...`;
  }
}

socket.on("connect", () => {
  console.log("Connected to namespace as:", socket.id);
  socket.emit("getUsers");
  socket.emit("getInitialName");
});

socket.on("initialName", (name) => {
  myName = name;
  console.log("Initial name received:", myName);
});

const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");

sendMessageButton.addEventListener("click", () => {
    sendMessage();
});

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("chatMessage", { message, name: myName });
        messageInput.value = "";
    }
}

socket.on("chatMessage", ({ message, name }) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${name}: ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});