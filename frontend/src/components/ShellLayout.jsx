import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { CreateRoomModal } from "./modals/CreateRoomModal.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { generateUniqueRoomCode } from "../utils/ids.js";

export const ShellLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rooms, createRoom, logout } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const previewCode = useMemo(() => generateUniqueRoomCode(rooms), [rooms]);

  const handleRoomCreated = (roomName) => {
    const room = createRoom(roomName);
    setShowCreate(false);
    navigate(`/rooms/${room.id}`);
  };

  const isHome = location.pathname === "/";

  return (
    <div className="app-root">
      <header className="top-nav">
        <div className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark" />
          <span className="brand-text">Convoy Walkie</span>
        </div>
        <nav className="nav-links">
          <NavLink to="/rooms" className="nav-link">
            Rooms
          </NavLink>
          <NavLink to="/profile" className="nav-link">
            Profile
          </NavLink>
        </nav>
        <div className="top-nav-actions">
          <button
            className="primary-btn create-room-btn"
            onClick={() => setShowCreate(true)}
          >
            Create Room
          </button>
          <button
            className="secondary-btn create-room-btn"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className={isHome ? "page page-centered" : "page"}>{children}</main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          roomIdPreview={previewCode}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
};
