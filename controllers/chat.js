const { getIO } = require('../utils/socket');
const { Chat, User } = require('../db/models');
const io = getIO();

io.on('connection', async (socket) => {
  socket.on('loggedIn', async ({ roomName }) => {
    socket.join(roomName);
    io.emit('ping', roomName);
  });

  socket.on('pong', async ({ roomName }) => {
    socket.join(roomName);
    const sockets = await io.in(roomName).fetchSockets();
  });
  // send
  socket.on('send', async ({ roomName, message, clientId, adminId }) => {
    await Chat.create({
      clientId,
      message,
      adminId,
    });
    let admin = await User.findByPk(adminId);
    let client = await User.findByPk(clientId);
    let messageObject = {
      admin,
      client,
      message,
    };
    socket.to(roomName).emit('reply', messageObject);
  });
});
