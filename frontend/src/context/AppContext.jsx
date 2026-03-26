import { createContext, useContext, useMemo, useState } from "react";
import { generateUniqueRoomCode, generateUserId } from "../utils/ids.js";

const STORAGE_KEYS = {
  rooms: "walkie.rooms",
  profile: "walkie.profile",
  friends: "walkie.friends",
  accounts: "walkie.accounts",
  authSession: "walkie.authSession"
};

const defaultRooms = [
  { id: "ROOM-1234", name: "Friday Night Convoy" },
  { id: "ROOM-5678", name: "Airport Pickup Line" },
  { id: "ROOM-9012", name: "Weekend Road Trip" }
];

const defaultProfile = {
  name: "Jordan Driver",
  userId: generateUserId(),
  photoDataUrl: ""
};

const defaultFriends = [
  { id: "USER-3101", name: "Alex", photoDataUrl: "" },
  { id: "USER-4920", name: "Priya", photoDataUrl: "" },
  { id: "USER-7744", name: "Sam", photoDataUrl: "" }
];

const defaultAccounts = [
  {
    name: "Demo Driver",
    email: "demo@walkie.app",
    password: "demo1234"
  }
];

const AppContext = createContext(null);

const loadFromStorage = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

export const AppProvider = ({ children }) => {
  const [rooms, setRooms] = useState(() =>
    loadFromStorage(STORAGE_KEYS.rooms, defaultRooms)
  );
  const [profile, setProfile] = useState(() =>
    loadFromStorage(STORAGE_KEYS.profile, defaultProfile)
  );
  const [friends, setFriends] = useState(() =>
    loadFromStorage(STORAGE_KEYS.friends, defaultFriends)
  );
  const [accounts, setAccounts] = useState(() =>
    loadFromStorage(STORAGE_KEYS.accounts, defaultAccounts)
  );
  const [authSession, setAuthSession] = useState(() =>
    loadFromStorage(STORAGE_KEYS.authSession, null)
  );

  const persistRooms = (nextRooms) => {
    setRooms(nextRooms);
    localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(nextRooms));
  };

  const persistProfile = (nextProfile) => {
    setProfile(nextProfile);
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(nextProfile));
  };

  const persistFriends = (nextFriends) => {
    setFriends(nextFriends);
    localStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(nextFriends));
  };

  const persistAccounts = (nextAccounts) => {
    setAccounts(nextAccounts);
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(nextAccounts));
  };

  const persistAuthSession = (nextSession) => {
    setAuthSession(nextSession);
    localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(nextSession));
  };

  const createRoom = (roomName) => {
    const trimmedName = roomName.trim();
    const id = generateUniqueRoomCode(rooms);
    const room = { id, name: trimmedName };
    persistRooms([room, ...rooms]);
    return room;
  };

  const getRoomById = (roomId) => rooms.find((room) => room.id === roomId);

  const getOrCreateRoomById = (roomId) => {
    const normalizedId = roomId.toUpperCase();
    const existingRoom = getRoomById(normalizedId);
    if (existingRoom) return existingRoom;

    const newRoom = {
      id: normalizedId,
      name: `Trip Room ${normalizedId.slice(-4)}`
    };
    persistRooms([newRoom, ...rooms]);
    return newRoom;
  };

  const updateProfile = (updates) => {
    const nextProfile = { ...profile, ...updates };
    persistProfile(nextProfile);
  };

  const addFriend = ({ id, name }) => {
    const normalizedId = id.trim().toUpperCase();
    if (!normalizedId) return { ok: false, reason: "missing-id" };
    if (friends.some((friend) => friend.id === normalizedId)) {
      return { ok: false, reason: "duplicate" };
    }

    const nextFriend = {
      id: normalizedId,
      name: name.trim() || `Friend ${normalizedId.slice(-4)}`,
      photoDataUrl: ""
    };
    persistFriends([nextFriend, ...friends]);
    return { ok: true };
  };

  const removeFriend = (id) => {
    const nextFriends = friends.filter((friend) => friend.id !== id);
    persistFriends(nextFriends);
  };

  const removeRoom = (roomId) => {
    const nextRooms = rooms.filter((room) => room.id !== roomId);
    persistRooms(nextRooms);
  };

  const login = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts.find(
      (entry) => entry.email === normalizedEmail && entry.password === password
    );
    if (!account) {
      return { ok: false, message: "Invalid email or password." };
    }

    const session = { email: account.email, name: account.name };
    persistAuthSession(session);
    updateProfile({ name: account.name || profile.name });
    return { ok: true };
  };

  const signup = ({ name, email, password }) => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!trimmedName || !normalizedEmail || !password) {
      return { ok: false, message: "Please complete all fields." };
    }

    if (accounts.some((entry) => entry.email === normalizedEmail)) {
      return { ok: false, message: "Email already in use." };
    }

    const nextAccounts = [
      ...accounts,
      { name: trimmedName, email: normalizedEmail, password }
    ];
    persistAccounts(nextAccounts);
    persistAuthSession({ email: normalizedEmail, name: trimmedName });
    updateProfile({ name: trimmedName });
    return { ok: true };
  };

  const logout = () => {
    persistAuthSession(null);
  };

  const value = useMemo(
    () => ({
      rooms,
      profile,
      friends,
      createRoom,
      getRoomById,
      getOrCreateRoomById,
      updateProfile,
      addFriend,
      removeFriend,
      removeRoom,
      authSession,
      isAuthenticated: Boolean(authSession),
      login,
      signup,
      logout
    }),
    [rooms, profile, friends, authSession, accounts]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
