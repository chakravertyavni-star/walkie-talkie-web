import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";

const initialParticipants = [
  { id: "u1", userId: "YOU", name: "You", isSpeaking: false, photoDataUrl: "" },
  {
    id: "u2",
    userId: "USER-LEAD",
    name: "Lead Car",
    isSpeaking: false,
    photoDataUrl: ""
  },
  {
    id: "u3",
    userId: "USER-SUPPORT",
    name: "Support",
    isSpeaking: false,
    photoDataUrl: ""
  }
];

export const RoomPage = () => {
  const { roomId } = useParams();
  const { profile, friends, getRoomById, getOrCreateRoomById } = useAppContext();
  const normalizedRoomId = (roomId || "").toUpperCase();
  const existingRoom = getRoomById(normalizedRoomId);
  const [resolvedRoom, setResolvedRoom] = useState(existingRoom);
  const [micOn, setMicOn] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [addStatus, setAddStatus] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [participants, setParticipants] = useState(initialParticipants);

  useEffect(() => {
    if (existingRoom) {
      setResolvedRoom(existingRoom);
      return;
    }

    if (normalizedRoomId) {
      const createdRoom = getOrCreateRoomById(normalizedRoomId);
      setResolvedRoom(createdRoom);
    }
  }, [existingRoom, getOrCreateRoomById, normalizedRoomId]);

  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "u1" ? { ...p, isSpeaking: micOn } : { ...p, isSpeaking: false }
      )
    );
  }, [micOn]);

  const handleAddParticipant = () => {
    const normalizedUserId = newUserId.trim().toUpperCase();
    if (!normalizedUserId) {
      setAddStatus("Enter a valid user ID.");
      return;
    }

    const duplicate = participants.some((p) => p.userId === normalizedUserId);
    if (duplicate) {
      setAddStatus("This user is already in the room.");
      return;
    }

    const matchedFriend = friends.find((friend) => friend.id === normalizedUserId);
    const resolvedName =
      newUserName.trim() ||
      matchedFriend?.name ||
      `User ${normalizedUserId.slice(-4)}`;

    const nextParticipant = {
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: normalizedUserId,
      name: resolvedName,
      isSpeaking: false,
      photoDataUrl: matchedFriend?.photoDataUrl || ""
    };

    setParticipants((prev) => [...prev, nextParticipant]);
    setNewUserId("");
    setNewUserName("");
    setAddStatus("Participant added.");
    setShowAddUserModal(false);
  };

  return (
    <section className="room-page">
      <header className="room-header">
        <div className="room-header-center">
          <h1 className="page-title">{resolvedRoom?.name || "Room"}</h1>
          <div className="room-meta-value room-meta-standalone">
            {resolvedRoom?.id || normalizedRoomId}
          </div>
        </div>
      </header>

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
                {p.id === "u1" && profile.photoDataUrl ? (
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
                <div className="participant-name">{p.name}</div>
                {p.isSpeaking && <div className="speaking-indicator">Speaking</div>}
              </div>
            </div>
          ))}
          <button
            className="add-user-tile"
            onClick={() => setShowAddUserModal(true)}
            aria-label="Add user"
          >
            <span className="add-user-plus">+</span>
            <span>Add User</span>
          </button>
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
          <p className="mic-helper-text">{micOn ? "Mic is ON" : "Mic is OFF"}</p>
        </div>
      </div>

      {showAddUserModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h2>Add User to Room</h2>
              <button
                className="icon-button"
                onClick={() => setShowAddUserModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="field">
              <span className="field-label">User ID</span>
              <input
                type="text"
                placeholder="USER-1234"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <div className="field">
              <span className="field-label">Name (Optional)</span>
              <input
                type="text"
                placeholder="Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            {addStatus ? <p className="page-subtitle status-text">{addStatus}</p> : null}
            <div className="modal-footer">
              <button
                className="primary-btn"
                onClick={handleAddParticipant}
                disabled={!newUserId.trim()}
              >
                Add User
              </button>
              <button className="ghost-btn" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
