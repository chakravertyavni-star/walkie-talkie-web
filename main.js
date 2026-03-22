import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6dSqH8uO48i_zaB2GevGfyBRvsYkGU9M",
  authDomain: "webrtc-demo-38124.firebaseapp.com",
  projectId: "webrtc-demo-38124",
  storageBucket: "webrtc-demo-38124.firebasestorage.app",
  messagingSenderId: "202037336053",
  appId: "1:202037336053:web:c6dd2220457ddb0c21b2bc",
  measurementId: "G-6JRKN1M3G0"
};

const hasFirebaseConfig =
  firebaseConfig &&
  typeof firebaseConfig === 'object' &&
  typeof firebaseConfig.apiKey === 'string' &&
  firebaseConfig.apiKey.length > 0;

let firestore = null;
if (hasFirebaseConfig) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  firestore = firebase.firestore();
} else {
  console.warn(
    'Firebase is not configured. Webcam will work, but call signaling is disabled. Add your Firebase config in main.js to enable calling.'
  );
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const peerId = Math.random().toString(36).slice(2, 10);
let localStream = null;
let roomId = null;
let participantsUnsubscribe = null;
let signalsUnsubscribe = null;
const peerConnections = new Map();
const participantRefs = new Map();
const pendingIceCandidates = new Map();
const participantNames = new Map();
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_MAX_ATTEMPTS = 10;

const displayNameInput = document.getElementById('displayNameInput');
const micButton = document.getElementById('micButton');
const localAudio = document.getElementById('localAudio');
const createRoomButton = document.getElementById('createRoomButton');
const roomInput = document.getElementById('roomInput');
const joinRoomButton = document.getElementById('joinRoomButton');
const remoteAudios = document.getElementById('remoteAudios');
const hangupButton = document.getElementById('hangupButton');

function sendSignal(to, payload) {
  return firestore.collection('rooms').doc(roomId).collection('signals').add({
    ...payload,
    from: peerId,
    to,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function generateRoomCode(length = ROOM_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function getDisplayName() {
  const raw = displayNameInput ? displayNameInput.value.trim() : '';
  return raw;
}

function setParticipantName(remotePeerId, displayName) {
  participantNames.set(remotePeerId, displayName);
  const labelEl = document.getElementById(`remote-label-${remotePeerId}`);
  if (labelEl) {
    labelEl.textContent = displayName;
  }
}

async function createNumericRoomRef() {
  for (let attempt = 0; attempt < ROOM_CODE_MAX_ATTEMPTS; attempt += 1) {
    const code = generateRoomCode();
    const roomRef = firestore.collection('rooms').doc(code);
    const snapshot = await roomRef.get();
    if (!snapshot.exists) {
      return roomRef;
    }
  }
  throw new Error('Could not allocate a unique room code. Please try again.');
}

function ensureRemoteAudioElement(remotePeerId) {
  const existing = document.getElementById(`remote-audio-${remotePeerId}`);
  if (existing) return existing;

  const card = document.createElement('div');
  card.className = 'remote-audio-card';
  card.id = `remote-card-${remotePeerId}`;

  const label = document.createElement('p');
  label.id = `remote-label-${remotePeerId}`;
  label.textContent = participantNames.get(remotePeerId) || 'Participant';

  const audio = document.createElement('audio');
  audio.id = `remote-audio-${remotePeerId}`;
  audio.autoplay = true;
  audio.controls = true;

  card.appendChild(label);
  card.appendChild(audio);
  remoteAudios.appendChild(card);
  return audio;
}

function closePeer(remotePeerId) {
  const pc = peerConnections.get(remotePeerId);
  if (pc) {
    pc.close();
    peerConnections.delete(remotePeerId);
  }
  pendingIceCandidates.delete(remotePeerId);
  participantNames.delete(remotePeerId);
  const card = document.getElementById(`remote-card-${remotePeerId}`);
  if (card) {
    card.remove();
  }
}

function getOrCreatePeerConnection(remotePeerId) {
  if (peerConnections.has(remotePeerId)) {
    return peerConnections.get(remotePeerId);
  }

  const pc = new RTCPeerConnection(servers);
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const remoteAudio = ensureRemoteAudioElement(remotePeerId);
    const [stream] = event.streams;
    if (stream) {
      remoteAudio.srcObject = stream;
    }
  };

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await sendSignal(remotePeerId, {
        type: 'candidate',
        candidate: event.candidate.toJSON(),
      });
    }
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    if (state === 'failed') {
      pc.restartIce();
      return;
    }
    if (state === 'closed') {
      closePeer(remotePeerId);
    }
  };

  peerConnections.set(remotePeerId, pc);
  return pc;
}

async function createOfferFor(remotePeerId) {
  const pc = getOrCreatePeerConnection(remotePeerId);
  if (pc.signalingState !== 'stable') return;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendSignal(remotePeerId, {
    type: 'offer',
    description: offer,
  });
}

async function connectToParticipant(remotePeerId) {
  const shouldCreateOffer = peerId < remotePeerId;
  getOrCreatePeerConnection(remotePeerId);
  if (shouldCreateOffer) {
    await createOfferFor(remotePeerId);
  }
}

async function flushPendingCandidates(remotePeerId) {
  const pc = peerConnections.get(remotePeerId);
  const queued = pendingIceCandidates.get(remotePeerId) || [];
  if (!pc || !pc.remoteDescription || queued.length === 0) return;

  for (const candidate of queued) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  pendingIceCandidates.delete(remotePeerId);
}

async function joinRoom(targetRoomId) {
  if (!firestore) {
    alert('Firebase is not configured yet. Add your Firebase config in main.js to enable calling.');
    return;
  }
  if (!localStream) {
    alert('Start microphone before joining a room.');
    return;
  }
  if (!targetRoomId) {
    alert('Enter a room ID first.');
    return;
  }

  const displayName = getDisplayName();
  if (!displayName) {
    alert('Please enter your display name before joining a room.');
    return;
  }

  roomId = targetRoomId;
  const roomRef = firestore.collection('rooms').doc(roomId);
  const roomSnapshot = await roomRef.get();
  if (!roomSnapshot.exists) {
    alert('Room not found. Create a room first or check the room ID.');
    return;
  }

  const myParticipantRef = roomRef.collection('participants').doc(peerId);
  participantRefs.set(peerId, myParticipantRef);
  await myParticipantRef.set({
    peerId,
    name: displayName,
    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  if (displayNameInput) {
    displayNameInput.disabled = true;
  }

  participantsUnsubscribe = roomRef.collection('participants').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const remotePeerId = change.doc.id;
      if (remotePeerId === peerId) return;

      const data = change.doc.data() || {};
      const rawName = data.name != null ? String(data.name).trim() : '';
      const labelText = rawName || `Guest (${remotePeerId.slice(0, 4)})`;

      if (change.type === 'added' || change.type === 'modified') {
        setParticipantName(remotePeerId, labelText);
      }
      if (change.type === 'added') {
        connectToParticipant(remotePeerId);
      }
      if (change.type === 'removed') {
        closePeer(remotePeerId);
      }
    });
  });

  signalsUnsubscribe = roomRef
    .collection('signals')
    .where('to', '==', peerId)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added') return;
        try {
          const signal = change.doc.data();
          const from = signal.from;
          const pc = getOrCreatePeerConnection(from);

          if (signal.type === 'offer' && signal.description) {
            if (pc.signalingState !== 'stable') {
              await pc.setLocalDescription({ type: 'rollback' });
            }
            await pc.setRemoteDescription(new RTCSessionDescription(signal.description));
            await flushPendingCandidates(from);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(from, {
              type: 'answer',
              description: answer,
            });
          } else if (signal.type === 'answer' && signal.description) {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.description));
              await flushPendingCandidates(from);
            }
          } else if (signal.type === 'candidate' && signal.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              const queued = pendingIceCandidates.get(from) || [];
              queued.push(signal.candidate);
              pendingIceCandidates.set(from, queued);
            }
          }
        } catch (err) {
          console.error('Signal handling failed:', err);
        }
      });
    });

  createRoomButton.disabled = true;
  joinRoomButton.disabled = true;
  roomInput.disabled = true;
  hangupButton.disabled = false;
}

async function leaveRoom() {
  if (participantsUnsubscribe) {
    participantsUnsubscribe();
    participantsUnsubscribe = null;
  }
  if (signalsUnsubscribe) {
    signalsUnsubscribe();
    signalsUnsubscribe = null;
  }

  if (roomId && firestore) {
    const myParticipantRef = participantRefs.get(peerId);
    if (myParticipantRef) {
      await myParticipantRef.delete();
      participantRefs.delete(peerId);
    }
  }

  [...peerConnections.keys()].forEach((remotePeerId) => closePeer(remotePeerId));

  roomId = null;
  roomInput.disabled = false;
  createRoomButton.disabled = false;
  joinRoomButton.disabled = false;
  hangupButton.disabled = true;
  if (displayNameInput) {
    displayNameInput.disabled = false;
  }
}

micButton.onclick = async () => {
  if (!window.isSecureContext) {
    alert(
      'Microphone access requires a secure context. Run the app via the dev server (http://localhost) or https, not by opening index.html directly.'
    );
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    console.error('getUserMedia failed:', err);
    alert(`Could not start microphone.\n\n${err?.name || 'Error'}: ${err?.message || String(err)}`);
    return;
  }
  localAudio.srcObject = localStream;
  localAudio.muted = true;
  localAudio.volume = 0;
  createRoomButton.disabled = false;
  joinRoomButton.disabled = false;
  micButton.disabled = true;
};

createRoomButton.onclick = async () => {
  if (!firestore) {
    alert('Firebase is not configured yet. Add your Firebase config in main.js to enable calling.');
    return;
  }
  try {
    const roomRef = await createNumericRoomRef();
    await roomRef.set({
      createdBy: peerId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    roomInput.value = roomRef.id;
    await joinRoom(roomRef.id);
  } catch (err) {
    console.error('Room creation failed:', err);
    alert(`Could not create room.\n\n${err?.message || String(err)}`);
  }
};

joinRoomButton.onclick = async () => {
  await joinRoom(roomInput.value.trim());
};

hangupButton.onclick = async () => {
  await leaveRoom();
};

window.addEventListener('beforeunload', () => {
  if (roomId && firestore) {
    const myParticipantRef = participantRefs.get(peerId);
    if (myParticipantRef) {
      myParticipantRef.delete();
    }
  }
});
