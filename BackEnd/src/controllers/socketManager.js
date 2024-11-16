import mongoose from 'mongoose';
const { connection } = mongoose;
import { Server } from "socket.io";

let connections = {};
let messages = {};  // Fixed naming inconsistency
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("SOMETHING CONNECTED");
    console.log("A client connected with socket id:", socket.id);

    // Join the call logic
    socket.on("join-call", (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date(); // Track when the user connected

      // Notify all users in the call that a new user has joined
      connections[path].forEach((connId) => {
        io.to(connId).emit("user-joined", socket.id, connections[path]);
      });

      // If there are previous messages in the room, send them to the new user
      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
        });
      }
    });

    // Signaling for WebRTC
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Chat message handling
    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ['', false]
      );

      if (found) {
        // Initialize message array for the room if undefined
        if (!messages[matchingRoom]) {
          messages[matchingRoom] = [];
        }

        // Add the new message to the room's messages
        messages[matchingRoom].push({
          'sender': sender,
          "data": data,
          "socket-id-sender": socket.id
        });
        console.log("message", matchingRoom, ":", sender, data)

        // Broadcast the message to all users in the room
        connections[matchingRoom].forEach((connId) => {
          io.to(connId).emit("chat-message", data, sender, socket.id);
        });

        console.log(`Message sent to room ${matchingRoom} by ${sender}: ${data}`);
      } else {
        console.log('No matching room found for socket id:', socket.id);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const disconnectTime = new Date();
      const connectedTime = timeOnline[socket.id];
      const timeDiff = Math.abs(disconnectTime - connectedTime);

      console.log(`User ${socket.id} disconnected. Time online: ${timeDiff} ms`);

      // Find the room that the user was in
      let roomToRemoveFrom = null;

      Object.keys(connections).forEach((room) => {
        const index = connections[room].indexOf(socket.id);
        if (index !== -1) {
          roomToRemoveFrom = room;

          // Notify others that this user has left
          connections[room].forEach((connId) => {
            if (connId !== socket.id) {
              io.to(connId).emit('user-left', socket.id);
            }
          });

          // Remove the user from the room
          connections[room].splice(index, 1);
          if (connections[room].length === 0) {
            delete connections[room];  // Remove the room if no users remain
          }
        }
      });

      if (roomToRemoveFrom) {
        console.log(`User ${socket.id} removed from room: ${roomToRemoveFrom}`);
      }

      // Clean up time tracking
      delete timeOnline[socket.id];
    });
  });

  return io;
};













// import mongoose from 'mongoose';
// const { connection } = mongoose;
// // import { connection } from "mongoose";
// import {Server} from "socket.io";

// let connections = {};
// let message = {};
// let timeOnline = {};


// export const connectToSocket = (server) => {
//     const io = new Server(server, {
//       cors : {
//         origin : "*",
//         methods: ["GET", "POST"],
//         allowedHeaders: ["*"],
//         credentials: true
//       }
//     });


//     io.on("connection", (socket) => {

//       console.log("Something Connected");

//     socket.on("join-call", (path) => {
        
//         if(connections[path] === undefined) {
//            connections[path] = [];
//         }
//         connections[path].push(socket.id);

//         timeOnline[socket.id] = new Date();
        
//         // connections[path].forEach(elem => {
//         //    io.to(elem);
//         // });

//         for(let a = 0; a < connections[path].length; a++) {
//            io.to(connections[path[a]]).emit("user-joined", socket.id, connections[path]);
//         }

//         if(message[path] !== undefined) {
//           for(let a = 0; a< message[path].length; ++a) {
//             io.to(socket.id).emit("chat-message", messages[path][a]['data'],
//               messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
//           }
//         }

//       });

//     socket.on("signal", (toId, message) => {
//         io.to(toId).emit("signal", socket.id, message);
//       })

//     socket.on("chat-message", (data, sender) => {
        
//        const [matchingRoom ,found] = Object.entries(connections)
//        .reduce(([room, isFound], [roomKey, roomValue]) => {

//         if(!isFound && roomValue.includes(socket.id)) {
//           return [roomKey, value];
//         }

//         return [room, isFound];

//        }, ['', false]);

//       if(found === true) {
//         if(message[matchingRoom] === undefined) {
//           message[matchingRoom] = [];
//         }

//         message[matchingRoom].push({'sender': sender, "data": data, "socket-id-sender": socket.id});
//         console.log("message", key, ":", sender, data);

//         connection[matchingRoom].forEach((elem) => {
//           io.to(elem).emit("chat-message", data, sender, socket.id)
//         });

//       }
//     })

//     socket.on("disconnect", () => {
        
//         var diffTime = Math.abs(timeOnline[socket.id] - new Date());

//         var key

//         for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

//             for(let a = 0; a < v.length; ++a) {
//               if(v[a] === socket.id) {
//                 key = k;

//                 for(let a = 0; a < connections[key].length; ++a) {
//                   io.to(connections[key][a].emit('user-left', socket.id));
//                 }
                
//                 var index = connections[key].indexOf(socket.id);

//                 connections[key].splice(index, 1);

//                 if(connections[key].length === 0) {
//                   delete connections[key];
//                 }

//               }
//             }

//         }

//     })

//     })

//     return io;
// };





// import mongoose from 'mongoose';
// import { Server } from "socket.io";

// const { connection } = mongoose;

// let connections = {};
// let messages = {}; // Fixed from `message` to `messages`
// let timeOnline = {};

// export const connectToSocket = (server) => {
//     const io = new Server(server, {
//         cors: {
//             origin: "*",
//             methods: ["GET", "POST"],
//             allowedHeaders: ["*"],
//             credentials: true
//         }
//     });

//     io.on("connection", (socket) => {
//         console.log("Something Connected");

//         socket.on("join-call", (path) => {
//             if (!connections[path]) {
//                 connections[path] = [];
//             }
//             connections[path].push(socket.id);
//             timeOnline[socket.id] = new Date();

//             for (let a = 0; a < connections[path].length; a++) {
//                 io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
//             }

//             // Emit existing messages to the new user if they exist
//             if (messages[path]) {
//                 for (let msg of messages[path]) {
//                     io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg['socket-id-sender']);
//                 }
//             }
//         });

//         socket.on("signal", (toId, message) => {
//             io.to(toId).emit("signal", socket.id, message);
//         });

//         socket.on("chat-message", (data, sender) => {
//             const [matchingRoom, found] = Object.entries(connections)
//                 .reduce(([room, isFound], [roomKey, roomValue]) => {
//                     if (!isFound && roomValue.includes(socket.id)) {
//                         return [roomKey, true]; // Fixed `value` to `true`
//                     }
//                     return [room, isFound];
//                 }, ['', false]);

//             if (found) {
//                 if (!messages[matchingRoom]) {
//                     messages[matchingRoom] = [];
//                 }

//                 messages[matchingRoom].push({ sender, data, "socket-id-sender": socket.id });
//                 console.log("message", matchingRoom, ":", sender, data); // Fixed `key` to `matchingRoom`

//                 connections[matchingRoom].forEach((elem) => {
//                     io.to(elem).emit("chat-message", data, sender, socket.id);
//                 });
//             }
//         });

//         socket.on("disconnect", () => {
//             const diffTime = Math.abs(timeOnline[socket.id] - new Date());

//             let key;
//             for (const [k, v] of Object.entries(connections)) {
//                 const index = v.indexOf(socket.id);
//                 if (index !== -1) {
//                     key = k;

//                     for (let a = 0; a < connections[key].length; a++) {
//                         io.to(connections[key][a]).emit('user-left', socket.id);
//                     }

//                     connections[key].splice(index, 1);

//                     if (connections[key].length === 0) {
//                         delete connections[key];
//                     }
//                     break; // Exit the loop once found
//                 }
//             }
//         });
//     });

//     return io;
// };