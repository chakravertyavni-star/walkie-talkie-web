const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// 🧠 Store rooms
// Format:
// {
//   ROOM1: [ { id, name } ]
// }
const rooms = {};

/* =========================
   🌐 HTTP ROUTES (TESTING)
========================= */

// Check server
app.get("/", (req, res) => {
    res.send("🚀 Server is running");
});

// View all rooms
app.get("/rooms", (req, res) => {
    res.json(rooms);
});

// Simulate user join (Thunder Client)
app.get("/test-join", (req, res) => {
    const room = "TEST123";

    if (!rooms[room]) rooms[room] = [];

    const fakeUser = {
        id: "user-" + Math.floor(Math.random() * 1000),
        name: "TestUser",
    };

    rooms[room].push(fakeUser);

    res.json({
        message: "User added",
        room,
        users: rooms[room],
    });
});

/* =========================
   🔌 SOCKET.IO (REAL-TIME)
========================= */

io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // JOIN ROOM
    socket.on("join-room", ({ roomCode, username }) => {
        socket.join(roomCode);

        if (!rooms[roomCode]) {
            rooms[roomCode] = [];
        }

        // Prevent duplicates
        const exists = rooms[roomCode].some(
            (user) => user.id === socket.id
        );

        if (!exists) {
            rooms[roomCode].push({
                id: socket.id,
                name: username || "Anonymous",
            });
        }

        console.log(`📌 Room ${roomCode}:`, rooms[roomCode]);

        // Send updated users to all in room
        io.to(roomCode).emit("room-users", rooms[roomCode]);
    });

    // START SPEAKING
    socket.on("start-speaking", (roomCode) => {
        socket.to(roomCode).emit("user-speaking", socket.id);
    });

    // STOP SPEAKING
    socket.on("stop-speaking", (roomCode) => {
        socket.to(roomCode).emit("user-stopped", socket.id);
    });

    // WEBRTC SIGNALING
    socket.on("signal", ({ room, signal, to }) => {
        if (to) {
            // Send to specific user
            io.to(to).emit("signal", {
                from: socket.id,
                signal,
            });
        } else {
            // Broadcast to room
            socket.to(room).emit("signal", {
                from: socket.id,
                signal,
            });
        }
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        console.log("🔴 User disconnected:", socket.id);

        for (let room in rooms) {
            const before = rooms[room].length;

            rooms[room] = rooms[room].filter(
                (user) => user.id !== socket.id
            );

            const after = rooms[room].length;

            if (before !== after) {
                console.log(`❌ Removed from ${room}`);

                io.to(room).emit("room-users", rooms[room]);
                socket.to(room).emit("user-left", socket.id);
            }

            // Delete empty room
            if (rooms[room].length === 0) {
                delete rooms[room];
                console.log(`🧹 Deleted empty room: ${room}`);
            }
        }
    });
});

/* =========================
   🚀 START SERVER
========================= */

server.listen(5002, () => {
    console.log("🚀 Server running on http://localhost:5002");
});