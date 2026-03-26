import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile } = useAppContext();

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="profile-page">
      <h1 className="page-title">Profile</h1>
      <div className="profile-card card">
        <div className="profile-main">
          <div className="profile-avatar profile-avatar-large">
            {profile.photoDataUrl ? (
              <img
                src={profile.photoDataUrl}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-id-label">Unique ID</div>
            <div className="profile-id-value">{profile.userId}</div>
          </div>
        </div>
        <div className="profile-actions">
          <button
            className="primary-btn"
            onClick={() => navigate("/profile/edit")}
          >
            Edit Profile
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/profile/friends")}
          >
            Friends
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate("/profile/settings")}
          >
            Settings
          </button>
        </div>
      </div>
    </section>
  );
};
