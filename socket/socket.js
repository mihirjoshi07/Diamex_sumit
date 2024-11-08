// const { Server } = require("socket.io");
// const http = require("http");
// const express = require("express");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*", // Allows requests from any origin
//         methods: ["GET", "POST", "PUT", "DELETE"],
//         credentials: true // Optional: if you need to support cookies or authentication
//     }
// });

// let userSocketMap={} //{userId : socketId}

// io.on("connection", (socket) => {
//     console.log(`Client connected with id : ${socket.id}`);
//     const userId=socket.handshake.query.userId;
    
//     if(userId != "undefined") userSocketMap[userId]=socket.id;
//     console.log(userSocketMap)
//     socket.on("disconnect",()=>{
//         console.log(`User disconnected with id ${socket.id}`);
//         delete userSocketMap[userId];
//         console.log(userSocketMap)
//     })
// })
// module.exports = { app, io, server }

const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows requests from any origin
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true // Optional: if you need to support cookies or authentication
    }
});

let userSocketMap={} //{userId : socketId}

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
    console.log(`Client connected with id : ${socket.id}`);
    const userId=socket.handshake.query.userId;
    
    if(userId != "undefined") userSocketMap[userId]=socket.id;
    console.log(userSocketMap)

    socket.on("disconnect",()=>{
        console.log("User disconnected with id ",socket.id);
        delete userSocketMap[userId];
        console.log(userSocketMap)
    })
})
module.exports = { app, io, server ,getReceiverSocketId}