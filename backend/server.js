console.log("Server.js is running!");

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (one level up from backend/)
config({ path: resolve(__dirname, ".env") });

// Import app AFTER dotenv config so env vars are available to db/client.js
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3000;

//Create http serve with express

app.listen(PORT, () => {
console.log(`server running on port ${PORT}`);
})
/*const httpServer = createServer(app);

//start server
httpServer.listen(PORT, () => {

});*/


