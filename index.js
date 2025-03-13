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

const validUsers = {
  tom: 'tom',
  toto: 'toto',
  lolo: 'lolo'
};

let conversations = {
  general: []
};

let connectedUsers = {};

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('login', ({ username, password }, callback) => {
    if (validUsers[username] && validUsers[username] === password) {
      connectedUsers[username] = socket.id;
      socket.join('general');
      socket.currentConversation = 'general';

      socket.emit('update users', Object.keys(connectedUsers).filter(user => user !== username));
      socket.broadcast.emit('update users', Object.keys(connectedUsers));

      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on('join conversation', (conversation) => {
    if (socket.currentConversation) {
      socket.leave(socket.currentConversation);
    }
    socket.currentConversation = conversation;
    socket.join(conversation);
    socket.emit('load messages', conversations[conversation] || []);
  });

  socket.on('chat message', ({ conversation, username, message }) => {
    if (!conversations[conversation]) {
      conversations[conversation] = [];
    }
    conversations[conversation].push({ username, message });
    io.to(conversation).emit('chat message', { conversation, username, message });
  });

  socket.on('disconnect', () => {
    const user = Object.keys(connectedUsers).find(user => connectedUsers[user] === socket.id);
    if (user) {
      delete connectedUsers[user];
      io.emit('update users', Object.keys(connectedUsers));
    }
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
