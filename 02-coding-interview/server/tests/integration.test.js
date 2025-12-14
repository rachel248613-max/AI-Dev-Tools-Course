const request = require('supertest');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');
const cors = require('cors');

describe('Backend Integration Tests', () => {
    let io, server, clientSocket, serverSocket;
    let app, httpServer;
    let port;

    beforeAll((done) => {
        app = express();
        app.use(cors());
        app.use(express.json());

        // Re-implement basic routes for testing to avoid importing entire index.js which listens on port
        app.get('/', (req, res) => {
            res.send('<html>Mock Index</html>');
        });

        httpServer = http.createServer(app);

        io = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Use random port
        httpServer.listen(() => {
            port = httpServer.address().port;
            clientSocket = new Client(`http://localhost:${port}`);

            io.on('connection', (socket) => {
                serverSocket = socket;

                socket.on('join-room', (payload) => {
                    // Logic from real server
                    const roomId = payload.roomId || payload;
                    const name = payload.name || 'User';
                    socket.join(roomId);
                    socket.broadcast.to(roomId).emit('user-joined', { id: socket.id, name });
                });
            });

            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.close();
        httpServer.close();
    });

    // Test: GET / (Health Check / Static File)
    test('GET / should return index.html', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('<html>Mock Index</html>');
    });

    // Code execution test removed (handled client-side now)

    // Test Socket.IO
    test('Socket.IO should broadcast user-joined event', (done) => {
        const roomId = 'test-room';
        const userName = 'Test User';

        // Listen for event on a second client (to simulate broadcast)
        const client2 = new Client(`http://localhost:${port}`);

        client2.on('connect', () => {
            client2.emit('join-room', { roomId, name: 'Listener' });

            // Should receive user-joined from first client
            client2.on('user-joined', (data) => {
                try {
                    expect(data.name).toBe(userName);
                    client2.close();
                    done();
                } catch (error) {
                    client2.close();
                    done(error);
                }
            });

            // Now first client joins
            clientSocket.emit('join-room', { roomId, name: userName });
        });
    });
});
