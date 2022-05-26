// @ts-nocheck

let io;
module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
      origin: [/localhost:*/,/.*afriservebeta.com.ng*/,/api.afriservebeta.com.ng:*/,/admin.afriservebeta.com.ng:*/,/artisans.afriservebeta.com.ng:*/],
        // methods: ["GET", "POST", "PUT"],
        credentials: true
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io is not initialized");
    }
    return io;
  },
};
