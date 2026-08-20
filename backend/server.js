console.log("Server.js is running!");

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (one level up from backend/)
config({ path: resolve(__dirname, ".env") });

// Import app AFTER dotenv config so env vars are available to db/client.js
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3000;

//Create http serve with express
const httpServer = createServer(app);

//create socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

//socket.io conection
io.on("connection", (socket) => {
  console.log("Socket Connected: ", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket Disconnected: ", socket.id);
  });
});

//start server
httpServer.listen(PORT, () => {
console.log(`server running on port ${PORT}`);
});


