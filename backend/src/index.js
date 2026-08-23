require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const { startBackgroundJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('[WebSocket] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[WebSocket] Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  startBackgroundJobs(io);
});
