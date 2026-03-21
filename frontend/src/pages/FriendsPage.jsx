import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

export const FriendsPage = () => {
  const navigate = useNavigate();
  const { friends, profile, addFriend, removeFriend } = useAppContext();
  const [friendId, setFriendId] = useState("");
  const [friendName, setFriendName] = useState("");
  const [status, setStatus] = useState("");

  const handleAddFriend = () => {
    const result = addFriend({ id: friendId, name: friendName });
    if (result.ok) {
      setFriendId("");
      setFriendName("");
      setStatus("Friend added.");
      return;
    }

    if (result.reason === "duplicate") {
      setStatus("This friend ID already exists.");
      return;
    }
    setStatus("Please enter a valid friend ID.");
  };

  const handleShareMyId = async () => {
    const shareText = `Add me on Convoy Walkie: ${profile.userId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Friend ID", text: shareText });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("Your friend ID has been copied.");
    } catch {
      // no-op
    }
  };

  return (
    <section className="settings-page card">
      <h1 className="page-title">Friends</h1>
      <p className="page-subtitle">Manage contacts you travel with often.</p>

      <div className="add-friend-panel">
        <label className="field">
          <span className="field-label">Friend ID</span>
          <input
            type="text"
            placeholder="USER-1234"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Friend Name (Optional)</span>
          <input
            type="text"
            placeholder="Name"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
          />
        </label>
        <div className="profile-actions">
          <button
            className="primary-btn"
            onClick={handleAddFriend}
            disabled={!friendId.trim()}
          >
            Add Friend
          </button>
          <button className="secondary-btn" onClick={handleShareMyId}>
            Share My Friend ID
          </button>
        </div>
        {status ? <p className="page-subtitle status-text">{status}</p> : null}
      </div>

      <ul className="friends-list">
        {friends.map((friend) => (
          <li key={friend.id} className="room-row room-row-spacious room-row-premium">
            <div className="room-row-main room-card-content">
              <div className="friend-row-main">
                <div className="participant-avatar">
                  {friend.photoDataUrl ? (
                    <img
                      src={friend.photoDataUrl}
                      alt={friend.name}
                      className="participant-avatar-image"
                    />
                  ) : (
                    friend.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="room-row-main">
                  <div className="room-name">{friend.name}</div>
                  <div className="room-id">{friend.id}</div>
                </div>
              </div>
            </div>
            <div className="row-actions row-actions-bottom-right">
              <button
                className="secondary-btn danger-btn room-action-btn"
                onClick={() => removeFriend(friend.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="profile-actions top-gap">
        <button className="ghost-btn" onClick={() => navigate("/profile")}>
          Back
        </button>
      </div>
    </section>
  );
};
