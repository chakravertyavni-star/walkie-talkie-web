import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5002";

const rtcConfig = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Socket.IO + mesh WebRTC — aligned with backend/server.js
 */
export function useWalkieRoom({ roomCode, userName, localStream, micOn }) {
  const [roomUsers, setRoomUsers] = useState([]);
  const [mySocketId, setMySocketId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [speakingRemoteId, setSpeakingRemoteId] = useState(null);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const pendingIceRef = useRef(new Map());
  const roomUsersRef = useRef([]);
  const localStreamRef = useRef(null);
  const micOnRef = useRef(false);
  const roomUpperRef = useRef("");
  const syncPeersRef = useRef(() => {});

  localStreamRef.current = localStream;
  micOnRef.current = micOn;

  const closePeer = useCallback((remoteId) => {
    const pc = peerConnectionsRef.current.get(remoteId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(remoteId);
    }
    pendingIceRef.current.delete(remoteId);
    setRemoteStreams((prev) => {
      if (!prev[remoteId]) return prev;
      const next = { ...prev };
      delete next[remoteId];
      return next;
    });
  }, []);

  const closeAllPeers = useCallback(() => {
    [...peerConnectionsRef.current.keys()].forEach((id) => closePeer(id));
  }, [closePeer]);

  const flushPendingCandidates = useCallback(async (remoteId) => {
    const pc = peerConnectionsRef.current.get(remoteId);
    const queued = pendingIceRef.current.get(remoteId) || [];
    if (!pc || !pc.remoteDescription || queued.length === 0) return;
    for (const c of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingIceRef.current.delete(remoteId);
  }, []);

  useEffect(() => {
    if (!roomCode || !userName?.trim()) return;

    const normalizedRoom = roomCode.toUpperCase();
    roomUpperRef.current = normalizedRoom;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const emitSignal = (to, payload) => {
      socket.emit("signal", {
        room: normalizedRoom,
        signal: payload,
        to,
      });
    };

    const getOrCreatePeerConnection = (remoteId) => {
      const stream = localStreamRef.current;
      if (!stream || !micOnRef.current) return null;

      if (peerConnectionsRef.current.has(remoteId)) {
        return peerConnectionsRef.current.get(remoteId);
      }

      const pc = new RTCPeerConnection(rtcConfig);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        const [ms] = event.streams;
        if (ms) {
          setRemoteStreams((prev) => ({ ...prev, [remoteId]: ms }));
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          emitSignal(remoteId, {
            type: "candidate",
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") pc.restartIce();
        if (pc.connectionState === "closed") closePeer(remoteId);
      };

      peerConnectionsRef.current.set(remoteId, pc);
      return pc;
    };

    const createOfferFor = async (remoteId) => {
      const pc = getOrCreatePeerConnection(remoteId);
      if (!pc || pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      emitSignal(remoteId, { type: "offer", description: offer });
    };

    const connectToParticipant = async (remoteId, myId) => {
      if (remoteId === myId) return;
      if (!localStreamRef.current || !micOnRef.current) return;

      getOrCreatePeerConnection(remoteId);
      if (myId < remoteId) {
        await createOfferFor(remoteId);
      }
    };

    const syncPeersFromList = async () => {
      const users = roomUsersRef.current;
      const myId = socket.id;
      if (!myId || !socket.connected) return;

      if (!localStreamRef.current || !micOnRef.current) {
        closeAllPeers();
        return;
      }

      const remoteIds = users.filter((u) => u.id !== myId).map((u) => u.id);
      for (const rid of remoteIds) {
        await connectToParticipant(rid, myId);
      }
      [...peerConnectionsRef.current.keys()].forEach((rid) => {
        if (rid !== myId && !remoteIds.includes(rid)) {
          closePeer(rid);
        }
      });
    };

    syncPeersRef.current = syncPeersFromList;

    const handleSignal = async ({ from, signal }) => {
      try {
        if (!localStreamRef.current || !micOnRef.current) return;

        const pc = getOrCreatePeerConnection(from);
        if (!pc) return;

        if (signal.type === "offer" && signal.description) {
          if (pc.signalingState !== "stable") {
            await pc.setLocalDescription({ type: "rollback" });
          }
          await pc.setRemoteDescription(
            new RTCSessionDescription(signal.description)
          );
          await flushPendingCandidates(from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          emitSignal(from, { type: "answer", description: answer });
        } else if (signal.type === "answer" && signal.description) {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.description)
            );
            await flushPendingCandidates(from);
          }
        } else if (signal.type === "candidate" && signal.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            const q = pendingIceRef.current.get(from) || [];
            q.push(signal.candidate);
            pendingIceRef.current.set(from, q);
          }
        }
      } catch (err) {
        console.error("Signal handling failed:", err);
      }
    };

    socket.on("connect", () => {
      setMySocketId(socket.id);
      setSocketConnected(true);
      setConnectionError(null);
      socket.emit("join-room", {
        roomCode: normalizedRoom,
        username: userName.trim(),
      });
    });

    socket.on("connect_error", (err) => {
      setConnectionError(err.message || "Could not connect to voice server");
      setSocketConnected(false);
    });

    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("room-users", (users) => {
      roomUsersRef.current = users;
      setRoomUsers(users);
      queueMicrotask(() => syncPeersFromList());
    });

    socket.on("signal", handleSignal);
    socket.on("user-speaking", (id) => setSpeakingRemoteId(id));
    socket.on("user-stopped", (id) => {
      setSpeakingRemoteId((prev) => (prev === id ? null : prev));
    });
    socket.on("user-left", (id) => closePeer(id));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      syncPeersRef.current = () => {};
      closeAllPeers();
      setRoomUsers([]);
      setMySocketId(null);
      setSocketConnected(false);
      setRemoteStreams({});
      setSpeakingRemoteId(null);
    };
  }, [roomCode, userName, closePeer, closeAllPeers, flushPendingCandidates]);

  /** Re-run mesh when mic or media stream changes */
  useEffect(() => {
    queueMicrotask(() => syncPeersRef.current());
  }, [micOn, localStream]);

  /** Speaking indicator broadcast */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const rc = roomUpperRef.current;
    if (!rc) return;
    if (micOn) {
      socket.emit("start-speaking", rc);
    } else {
      socket.emit("stop-speaking", rc);
    }
  }, [micOn, socketConnected]);

  return {
    roomUsers,
    mySocketId,
    socketConnected,
    connectionError,
    remoteStreams,
    speakingRemoteId,
  };
}
