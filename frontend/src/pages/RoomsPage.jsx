import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.jsx";

export const RoomsPage = () => {
  const navigate = useNavigate();
  const { rooms, removeRoom } = useAppContext();

  return (
    <section className="rooms-page">
      <h1 className="page-title">Rooms</h1>
      <p className="page-subtitle">
        Quick access to the rooms your group is using.
      </p>
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.id} className="room-row room-row-spacious room-row-premium">
            <div className="room-row-main room-card-content">
              <div className="room-name">{room.name}</div>
              <div className="room-id">{room.id}</div>
            </div>
            <div className="row-actions row-actions-bottom-right">
              <button
                className="primary-btn room-action-btn"
                onClick={() => navigate(`/rooms/${room.id}`)}
              >
                Start
              </button>
              <button
                className="secondary-btn danger-btn room-action-btn"
                onClick={() => removeRoom(room.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
