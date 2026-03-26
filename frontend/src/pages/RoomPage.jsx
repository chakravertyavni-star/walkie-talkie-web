import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import { useWalkieRoom } from "../hooks/useWalkieRoom.js";

export const RoomPage = () => {
  const { roomId } = useParams();
  const { profile, getRoomById, getOrCreateRoomById } = useAppContext();
  const normalizedRoomId = (roomId || "").toUpperCase();
  const existingRoom = getRoomById(normalizedRoomId);
  const [resolvedRoom, setResolvedRoom] = useState(existingRoom);
  const [micOn, setMicOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState("");

  const displayName = profile?.name?.trim() || "Guest";

  const {
    roomUsers,
    mySocketId,
    socketConnected,
    connectionError,
    remoteStreams,
    speakingRemoteId,
  } = useWalkieRoom({
    roomCode: normalizedRoomId,
    userName: displayName,
    localStream,
    micOn,
  });

  useEffect(() => {
    if (existingRoom) {
      setResolvedRoom(existingRoom);
      return;
    }
    if (normalizedRoomId) {
      setResolvedRoom(getOrCreateRoomById(normalizedRoomId));
    }
  }, [existingRoom, getOrCreateRoomById, normalizedRoomId]);

  /** Real microphone when mic is on */
  useEffect(() => {
    if (!micOn) {
      localStream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setMediaError("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        setMediaError("");
      } catch (err) {
        console.error(err);
        setMediaError(err?.message || "Could not access microphone");
        setMicOn(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [micOn]);

  const participants = useMemo(() => {
    if (!roomUsers.length) {
      return [
        {
          id: "pending",
          name: displayName,
          isLocal: true,
          isSpeaking: false,
          photoDataUrl: profile.photoDataUrl || "",
        },
      ];
    }

    return roomUsers.map((u) => {
      const isLocal = mySocketId && u.id === mySocketId;
      const isSpeaking =
        (isLocal && micOn) || (!isLocal && speakingRemoteId === u.id);
      return {
        id: u.id,
        name: u.name || "Anonymous",
        isLocal,
        isSpeaking,
        photoDataUrl: isLocal ? profile.photoDataUrl || "" : "",
      };
    });
  }, [
    roomUsers,
    mySocketId,
    micOn,
    speakingRemoteId,
    displayName,
    profile.photoDataUrl,
  ]);

  return (
    <section className="room-page">
      <header className="room-header">
        <div className="room-header-center">
          <h1 className="page-title">{resolvedRoom?.name || "Room"}</h1>
          <div className="room-meta-value room-meta-standalone">
            {resolvedRoom?.id || normalizedRoomId}
          </div>
          {!socketConnected && (
            <p className="page-subtitle status-text" style={{ marginTop: "0.5rem" }}>
              Connecting to voice server…
            </p>
          )}
          {connectionError && (
            <p className="page-subtitle status-text" style={{ color: "#fca5a5" }}>
              Voice server: {connectionError} — start backend on port 5002 or set
              VITE_SOCKET_URL.
            </p>
          )}
          {mediaError && (
            <p className="page-subtitle status-text" style={{ color: "#fca5a5" }}>
              Mic: {mediaError}
            </p>
          )}
        </div>
      </header>

      {/* Remote audio (WebRTC) */}
      <div className="remote-audio-hidden" aria-hidden="true">
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <audio key={id} autoPlay playsInline ref={(el) => {
            if (el) el.srcObject = stream;
          }} />
        ))}
      </div>

      <div className="room-layout">
        <div className="participants-strip">
          {participants.map((p) => (
            <div
              key={p.id}
              className={
                "participant-card" +
                (p.isSpeaking ? " participant-card-speaking" : "")
              }
            >
              <div className="participant-avatar">
                {p.isLocal && profile.photoDataUrl ? (
                  <img
                    src={profile.photoDataUrl}
                    alt="Your profile"
                    className="participant-avatar-image"
                  />
                ) : p.photoDataUrl ? (
                  <img
                    src={p.photoDataUrl}
                    alt={p.name}
                    className="participant-avatar-image"
                  />
                ) : (
                  p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                )}
              </div>
              <div className="participant-details">
                <div className="participant-name">
                  {p.name}
                  {p.isLocal ? " (you)" : ""}
                </div>
                {p.isSpeaking && (
                  <div className="speaking-indicator">Speaking</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mic-controls">
          <button
            className={
              "mic-circle-button" +
              (micOn ? " mic-circle-button-on pulse-ring" : " mic-circle-button-off")
            }
            onClick={() => setMicOn((prev) => !prev)}
            aria-label={micOn ? "Mute microphone" : "Enable microphone"}
          >
            <span className="mic-icon">🎙</span>
          </button>
          <p className="mic-helper-text">
            {micOn ? "Mic is ON — others can hear you" : "Mic is OFF"}
          </p>
        </div>
      </div>
    </section>
  );
};
