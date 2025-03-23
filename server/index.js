require("dotenv").config()
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const PORT = process.env.PORT || 5000
const origin = process.env.ORIGIN || "*"
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin,
  },
});
console.log(origin)
const users = {
  // userId: socketId
}

io.on('connection', (socket) => {
  
  socket.on("connected", ({ myUserId }) => {
    users[myUserId] = socket.id
    console.log(users)
  })

  socket.on("offer", ({ callerId, userToCallId, offer }) =>{
    io.to(users[userToCallId]).emit("offer", { callerId, offer })
  })
  
  socket.on("answer", ({ callerId, answer }) =>{
    io.to(users[callerId]).emit("answer", { answer })
  })

  socket.on("icecandidate", ({ outGoingUCallserId, candidate }) => {
    io.to(users[outGoingUCallserId]).emit("icecandidate", { candidate })
  })

  socket.on('disconnect', () => {
    Object.keys(users).forEach((userId) => {
      if (users[userId] === socket.id) {
        delete users[userId];
      }
    });
    
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Signaling server running on port 5000');
});