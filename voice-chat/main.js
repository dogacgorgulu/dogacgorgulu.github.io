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

// New: Name input elements
const nameInput = document.getElementById("nameInput");
const setNameButton = document.getElementById("setName");
let myName = ""; // Store the user's name

// New: Ringtone element
const ringtoneAudio = document.getElementById("ringtone");
const toggleMuteButton = document.getElementById("toggleMute");
let isMuted = true; // Start muted

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" }
];

// Initialize media stream
async function initMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.log("Media initialized:", localStream);
}

// New: Set Name Functionality
setNameButton.addEventListener("click", () => {
  const newName = nameInput.value.trim();
  if (newName !== "") {
    myName = newName;
    socket.emit("setName", newName);  // Send name to the server
  }
});

// New: Handle Name Updates
socket.on("userList", (users) => {
    // The server now sends a user list with names
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
            <span>User: ${user.name}</span>
            <button onclick="startCall('${user.id}')">Call</button>
        `;
        userList.appendChild(userElement);
    });
});

// Update user list on the front-end
socket.on("users", (users) => {
  // The server now sends a user list with names
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

// Toggle mute/unmute
toggleMuteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  ringtoneAudio.muted = isMuted;

  if (isMuted) {
    toggleMuteButton.textContent = "Unmute Ringtone";
  } else {
    toggleMuteButton.textContent = "Mute Ringtone";
  }
});

// Trigger a refresh of the user list
refreshUsersButton.addEventListener("click", () => {
  console.log("Requesting user list...");
  socket.emit("getUsers");
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
// Handle incoming offer
socket.on("offer", async ({ offer, from }) => {
  console.log("Received offer from:", from);

  // New: Play ringtone
  if (!isMuted) {
    ringtoneAudio.play();
  }

  // Show incoming call UI
  currentPeerId = from.id; // Access the ID from the from object
  callerIdSpan.textContent = from.name; // Access the name from the from object
  incomingCallDiv.style.display = "block";

  // Set up the peer connection but don't respond yet
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
});

// Answer the call
answerCallButton.addEventListener("click", async () => {
  console.log("Answering call from:", currentPeerId);

  // New: Stop ringtone
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
  hangUpButton.disabled = false; // Enable hang up button
});

// Reject the call
rejectCallButton.addEventListener("click", () => {
  console.log("Rejected call from:", currentPeerId);

  // New: Stop ringtone
  ringtoneAudio.pause();
  ringtoneAudio.currentTime = 0;

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