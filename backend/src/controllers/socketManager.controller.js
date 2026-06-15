import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowHeaders: ["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("USER CONNECTED:", socket.id);

    // User joins a call/room
    socket.on("join_call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      
      // Prevent duplicate socket IDs in the room list
      if (!connections[path].includes(socket.id)) {
        connections[path].push(socket.id);
      }
      
      timeOnline[socket.id] = new Date();

      // Notify other users in the room
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit("user_joined", socket.id, connections[path]);
      }

      // Send chat history of this room to the newly joined user
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; a++) {
          io.to(socket.id).emit(
            "chat_message",
            messages[path][a]['data'],
            messages[path][a]['sender'],
            messages[path][a]['socket-id-sender']
          );
        }
      }
    });

    // Handle signaling (WebRTC SDP/ICE exchange)
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Handle incoming chat messages
    socket.on("chat_message", (data, sender) => {
      // Find which room this socket belongs to
      const [matchingRoom, found] = Object.entries(connections)
        .reduce(([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        }, ["", false]);

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          'sender': sender,
          'data': data,
          'socket-id-sender': socket.id
        });

        console.log(`[Chat] Room ${matchingRoom} | ${sender}: ${data}`);

        // Broadcast message to all users in this room
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat_message", data, sender, socket.id);
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("USER DISCONNECTED:", socket.id);
      
      // Find the room the user was in
      for (const [roomKey, roomValue] of Object.entries(connections)) {
        const index = roomValue.indexOf(socket.id);
        if (index !== -1) {
          // Remove the user from the room list
          roomValue.splice(index, 1);
          
          // Notify remaining users in that room
          roomValue.forEach((elem) => {
            io.to(elem).emit("user_left", socket.id);
          });

          console.log(`User ${socket.id} left room ${roomKey}. Remaining: ${roomValue.length}`);

          // Clean up empty room
          if (roomValue.length === 0) {
            delete connections[roomKey];
            delete messages[roomKey];
          }
          break; // User can only be in one room at a time
        }
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};

export { connectToSocket };
