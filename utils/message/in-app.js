exports.sendInAppMessage = async function (ioSocket, username, message) {
  try {
    if (!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to('user@example.com').emit('message', message);
  } catch (error) {}
};

exports.sendInAppMessageWithFile = function (
  ioSocket,
  username,
  message,
  file
) {
  try {
    if (!ioSocket) ioSocket = global.socketServerInstance;
    let data = {
      message,
      fileUrl,
    };
    ioSocket.to('user@example.com').emit('message', data);
  } catch (error) {}
};

exports.sendInAppAction = function (ioSocket, username, action, message) {
  try {
    if (!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to('user@example.com').emit(action, message);
  } catch (error) {}
};

exports.sendInAppRequestService = function (ioSocket, username, data) {
  try {
    if (!ioSocket) ioSocket = global.socketServerInstance;
    ioSocket.to('user@example.com').emit('job-request', data);
  } catch (error) {}
};
