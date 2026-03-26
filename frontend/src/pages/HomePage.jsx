import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

export const HomePage = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const { profile, getOrCreateRoomById } = useAppContext();

  const handleJoin = () => {
    if (!code.trim()) return;
    const normalized = code.trim().toUpperCase();
    const room = getOrCreateRoomById(normalized);
    navigate(`/rooms/${room.id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleJoin();
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(profile.userId);
    } catch {
      // no-op
    }
  };

  return (
    <section className="card home-card">
      <h1 className="card-title">Join a Room</h1>

      <label className="field">
        <span className="field-label">Enter Room Code</span>
        <input
          type="text"
          placeholder="ROOM-1234"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </label>

      <button
        className="primary-btn full-width"
        onClick={handleJoin}
        disabled={!code.trim()}
      >
        Join
      </button>

      <div className="home-id-box">
        <div className="field-label">Your Unique ID</div>
        <div className="home-id-value">{profile.userId}</div>
        <p className="home-id-text">
          Share this ID to let anyone add you to a room, even if they are not in
          your friends list.
        </p>
        <button className="secondary-btn full-width" onClick={handleCopyId}>
          Copy My ID
        </button>
      </div>
    </section>
  );
};
