import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [voicePrompt, setVoicePrompt] = useState(true);
  const [speakerGlow, setSpeakerGlow] = useState(true);

  return (
    <section className="settings-page card">
      <h1 className="page-title">Settings</h1>
      <div className="settings-list">
        <label className="toggle-row">
          <span>Voice prompt when joining room</span>
          <input
            type="checkbox"
            checked={voicePrompt}
            onChange={() => setVoicePrompt((prev) => !prev)}
          />
        </label>
        <label className="toggle-row">
          <span>Highlight active speaker</span>
          <input
            type="checkbox"
            checked={speakerGlow}
            onChange={() => setSpeakerGlow((prev) => !prev)}
          />
        </label>
      </div>
      <div className="profile-actions">
        <button className="ghost-btn" onClick={() => navigate("/profile")}>
          Back
        </button>
      </div>
    </section>
  );
};
