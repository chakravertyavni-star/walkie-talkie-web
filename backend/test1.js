const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("User 1 connected:", socket.id);

  socket.emit("join-room", {
    roomCode: "PARTY123",
    username: "Avni"
  });

  socket.on("room-users", (data) => {
    console.log("User1 sees:", data);
  });

  socket.on("user-speaking", (id) => {
    console.log("User1 hears:", id);
  });

  setTimeout(() => {
    socket.emit("start-speaking", "PARTY123");
  }, 2000);
});
