import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};


const connectToSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {

    socket.on("join_call", (path) => {
      if (connections[path] === undefined){
        connections[path] = [];
      }
      connection[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      for(let id in connections[path]){
        io.to(connections[path][id]).emit("user_joined", socket.id);
      }
    })

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    })

    socket.on("chat_message", (message) => {
      io.emit("chat_message", message);
    })

    socket.on("disconnect", () => {

    })

  })

  return io;
};

export { connectToSocket };
