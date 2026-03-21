import { useState } from "react";

export const CreateRoomModal = ({ onClose, onCreated, roomIdPreview }) => {
  const [roomName, setRoomName] = useState("");

  const handleCreate = () => {
    if (!roomName.trim()) return;
    onCreated(roomName);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomIdPreview);
    } catch {
      // no-op for now
    }
  };

  const shareText = `Join my convoy room: ${roomIdPreview}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Convoy Room", text: shareText });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // no-op
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>Create Room</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">Room Name</span>
            <input
              type="text"
              placeholder="Sunday Drive to the Lake"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Room ID</span>
            <div className="inline-field">
              <input type="text" value={roomIdPreview} readOnly />
              <button className="secondary-btn" onClick={handleCopy}>
                Copy
              </button>
              <button className="secondary-btn" onClick={handleShare}>
                Share
              </button>
            </div>
          </label>
        </div>
        <div className="modal-footer">
          <button
            className="primary-btn"
            onClick={handleCreate}
            disabled={!roomName.trim()}
          >
            Create
          </button>
          <button className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
