const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("User 3 connected:", socket.id);

    socket.emit("join-room", {
        roomCode: "PARTY123",
        username: "Sam"
    });

    socket.on("room-users", (data) => {
        console.log("User3 sees:", data);
    });

    socket.on("user-speaking", (id) => {
        console.log("User3 hears:", id);
    });
});