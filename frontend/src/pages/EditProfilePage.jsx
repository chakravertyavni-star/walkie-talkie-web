import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAppContext();
  const [name, setName] = useState(profile.name);
  const [photoPreview, setPhotoPreview] = useState(profile.photoDataUrl);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const libraryInputRef = useRef(null);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile({ name: name.trim(), photoDataUrl: photoPreview });
    navigate("/profile");
  };

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPhotoPreview(result);
      setShowPhotoActions(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="settings-page card">
      <h1 className="page-title">Edit Profile</h1>

      <div className="edit-photo-block">
        <div className="profile-avatar profile-avatar-edit">
          {photoPreview ? (
            <img src={photoPreview} alt="Profile preview" className="profile-avatar-image" />
          ) : (
            initials || "U"
          )}
        </div>
        <button
          className="edit-photo-trigger"
          type="button"
          onClick={() => setShowPhotoActions(true)}
        >
          Edit picture ✎
        </button>
      </div>

      <label className="field">
        <span className="field-label">Display Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </label>

      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        onChange={onPhotoChange}
        className="hidden-input"
      />

      <div className="profile-actions">
        <button className="primary-btn" onClick={handleSave} disabled={!name.trim()}>
          Save
        </button>
        <button className="ghost-btn" onClick={() => navigate("/profile")}>
          Cancel
        </button>
      </div>

      {showPhotoActions && (
        <div
          className="sheet-overlay"
          role="button"
          tabIndex={0}
          onClick={() => setShowPhotoActions(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowPhotoActions(false);
          }}
        >
          <div
            className="photo-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <button
              className="sheet-action"
              type="button"
              onClick={() => libraryInputRef.current?.click()}
            >
              Choose from library
            </button>
            <button
              className="sheet-action sheet-action-danger"
              type="button"
              onClick={() => {
                setPhotoPreview("");
                setShowPhotoActions(false);
              }}
            >
              Remove current picture
            </button>
            <button
              className="sheet-action"
              type="button"
              onClick={() => setShowPhotoActions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
