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

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" }
];

// Initialize media stream
async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.log("Media initialized:", localStream);
}

// Trigger a refresh of the user list
refreshUsersButton.addEventListener("click", () => {
  console.log("Requesting user list...");
  socket.emit("getUsers");
});

// Update the user list on the front-end
socket.on("users", (users) => {
  console.log("Received user list:", users);
  userList.innerHTML = ""; // Clear existing list
  if (users.length === 0) {
    userList.innerHTML = "<p>No other users online.</p>";
    return;
  }
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.className = "user";
    userElement.innerHTML = `
      <span>User: ${user}</span>
      <button onclick="startCall('${user}')">Call</button>
    `;
    userList.appendChild(userElement);
  });
});

// Start a call with a specific user
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
  hangUpButton.disabled = false; // Enable hang up button
}

// Handle incoming offer
socket.on("offer", async ({ offer, from }) => {
  console.log("Received offer from:", from);

  // Show incoming call UI
  currentPeerId = from;
  callerIdSpan.textContent = from;
  incomingCallDiv.style.display = "block";

  // Set up the peer connection but don't respond yet
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
});

// Answer the call
answerCallButton.addEventListener("click", async () => {
  console.log("Answering call from:", currentPeerId);

  await initMedia();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", { target: currentPeerId, answer });
  incomingCallDiv.style.display = "none";
  hangUpButton.disabled = false; // Enable hang up button
});

// Reject the call
rejectCallButton.addEventListener("click", () => {
  console.log("Rejected call from:", currentPeerId);
  currentPeerId = null;
  incomingCallDiv.style.display = "none";
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
});

// Handle incoming answer
socket.on("answer", async ({ answer }) => {
  console.log("Received answer");
  await peerConnection.setRemoteDescription(answer);
});

// Handle incoming ICE candidate
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

// Hang up the call
hangUpButton.addEventListener("click", hangUp);
async function hangUp() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    currentPeerId = null;
  }
  console.log("Call ended.");
  hangUpButton.disabled = true; // Disable hang up button
}

// Connect to the server and request user list on connect
socket.on("connect", () => {
  console.log("Connected to namespace as:", socket.id);
  socket.emit("getUsers");
});
