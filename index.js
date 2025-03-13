import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

let messageHistory = [];

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
//   console.log('a user connected');
  
  socket.emit('load messages', messageHistory);

  socket.on('disconnect', () => {
    // console.log('user disconnected');
  });

  socket.on('chat message', (msgData) => {
    messageHistory.push(msgData);  
    
    io.emit('chat message', msgData);
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
