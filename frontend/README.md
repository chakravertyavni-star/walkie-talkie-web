## Convoy Walkie Frontend

React + Vite UI for group voice. **Voice signaling and WebRTC** use the **Socket.IO server** in `../backend/server.js` (not Firebase).

### Run locally (with backend)

1. Start the backend (port **5002**):

```bash
cd ../backend
npm install
npm start
```

2. Start the frontend:

```bash
npm install
npm run dev
```

3. Optional: point the app at another host (e.g. production):

Create `frontend/.env`:

```
VITE_SOCKET_URL=http://localhost:5002
```

### Implemented UI and flows

- Home page with room-code join and each user's unique ID for direct invites.
- Rooms page with room list and quick start buttons.
- **Room page**: connects to the backend via **Socket.IO** (`join-room`, `room-users`), **mesh WebRTC audio** via `signal` events, mic toggle with real `getUserMedia`, remote participant audio playback.
- Profile page with avatar, user info, and actions for edit/friends/settings.
- Edit Profile page with name update and profile photo upload.
- Friends page with add-friend by unique ID and share-my-ID.
- Settings page with client-side toggles.

### WebRTC implementation

- Hook: `src/hooks/useWalkieRoom.js` — aligns with backend events: `join-room`, `room-users`, `signal`, `start-speaking`, `stop-speaking`, `user-left`.

### Production build

```bash
npm run build
```

### Notes

- State is persisted in `localStorage` for rooms, profile, and friends.
- Room codes are auto-generated uniquely in the client (`ROOM-xxxx`).
- Unique user IDs are auto-generated (`USER-xxxx`) and can be shared to add people directly.
