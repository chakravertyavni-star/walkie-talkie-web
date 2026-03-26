export const randomDigits = (length) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const generateUniqueRoomCode = (existingRooms = []) => {
  const existingCodes = new Set(existingRooms.map((room) => room.id));
  let nextCode = "";

  do {
    nextCode = `ROOM-${randomDigits(4)}`;
  } while (existingCodes.has(nextCode));

  return nextCode;
};

export const generateUserId = () => `USER-${randomDigits(4)}`;
