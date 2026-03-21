## Convoy Walkie Frontend

React + Vite frontend for group vehicle voice communication. This project is frontend-only and does not connect to a backend yet.

### Implemented UI and flows

- Home page with room-code join and each user's unique ID for direct invites.
- Rooms page with room list and quick start buttons.
- Room page with room name/code, horizontal participant cards, active speaker glow, and circular pulsing mic button.
- Profile page with avatar, user info, and actions for edit/friends/settings.
- Edit Profile page with name update and profile photo upload.
- Friends page with add-friend by unique ID and share-my-ID.
- Settings page with client-side toggles.

### Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

### Notes

- State is persisted in `localStorage` for rooms, profile, and friends.
- Room codes are auto-generated uniquely in the client (`ROOM-xxxx`).
- Unique user IDs are auto-generated (`USER-xxxx`) and can be shared to add people directly.
