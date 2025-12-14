const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// const axios = require('axios'); // Removed
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Map of Room ID -> Array of User Objects { id, name }
const users = {};
// Map of Socket ID -> Room ID
const socketToRoom = {};

io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    socket.on('join-room', (payload) => {
        // Payload can be object { roomId, name } or string roomId (legacy fallback)
        const roomId = payload.roomId || payload;
        const name = payload.name || 'User';

        if (users[roomId]) {
            const existingUser = users[roomId].find(u => u.id === socket.id);
            if (!existingUser) {
                users[roomId].push({ id: socket.id, name });
            }
        } else {
            users[roomId] = [{ id: socket.id, name }];
        }
        socketToRoom[socket.id] = roomId;
        socket.join(roomId);
        console.log(`User ${name} (${socket.id}) joined room ${roomId}`);

        // Return list of other users in the room
        const usersInThisRoom = users[roomId].filter(u => u.id !== socket.id);
        socket.emit('all-users', usersInThisRoom);

        // Broadcast to others that a new user joined (Presence only, no signal)
        socket.broadcast.to(roomId).emit('user-joined', { id: socket.id, name });
    });

    socket.on('code-update', ({ roomId, code }) => {
        socket.to(roomId).emit('code-update', code);
    });

    socket.on('chat-message', ({ roomId, message, sender }) => {
        io.in(roomId).emit('chat-message', { message, sender, timestamp: new Date().toLocaleTimeString() });
    });

    socket.on('disconnect', () => {
        const roomId = socketToRoom[socket.id];
        let room = users[roomId];
        if (room) {
            room = room.filter(u => u.id !== socket.id);
            users[roomId] = room;
        }
        socket.broadcast.to(roomId).emit('user-left', socket.id);
        console.log('User disconnected', socket.id);
    });
});

// Endpoint removed: Code execution is now handled client-side via WASM

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
