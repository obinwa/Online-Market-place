#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require("../app");
// const app = express.app;
const debug = require("debug")("afriserve-backend:server");
// const http = require("http");
const { SERVER_CONFIG } = require("../utils");
const db = require("../db/models");
// const client = require("../connect/redis");
const schedule = require("../jobs/index");
const {checkNodeVersion} = require("../jobs/jobs");
// const { sendMessage } = require("../controllers/chat");

/**
 * Get port from environment and store in Express.
 */
// client;
const port = normalizePort(SERVER_CONFIG.port);
app.set("port", port);

/**
 * Create HTTP server.
 */

// const server = express.server;
// const io = express.io;

/**
 * Listen on provided port, on all network interfaces.
 */

// checkNodeVersion(14);

db.sequelize
  .authenticate()
  .then(async () => {
    // await db.sequelize.sync({ alter: true });
    console.log("Database connected");
    const httpServer = app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    });
    const io = require("../utils/socket").init(httpServer);
    io.on("connection", (socket) => {
      console.log("Connected");

      // sendMessage();
    });
  })
  .then(() => {
    schedule();
    const chat = require("../controllers/chat");
    chat;
  })
  .catch((error) => {
    console.log(`Error on initialize cron jobs and chat ${error}`);
  });
app.on("error", onError);
app.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
