import express from "express";
import { Server } from "socket.io";
import http from "http";
const app = express();
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const users = {
    // userid: socketid
  }

io.on("connection", (socket) => {
    socket.on("connected", (data) => {
        users[data.id] = socket.id
        console.log(users)
    })

    socket.on("offer", offer => {
      socket.broadcast.emit("offer", offer)
    })

    socket.on("answer", answer => {
      socket.broadcast.emit("answer", answer)
    })

    socket.on("disconnect", () => {
      Object.keys(users).forEach(key => {
        if(users[key] == socket.id){
          delete users[key]
        }
      })
      console.log("user disconnected", users)
    })
})

server.listen(3000, () => console.log("connected to socket"))