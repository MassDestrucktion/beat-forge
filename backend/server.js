console.log("Server.js is running!");
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root (one level up from backend/)
config({ path: resolve(__dirname, "../.env") });

// Import app AFTER dotenv config so env vars are available to db/client.js
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3000;
console.log("DATABASE_URL:", process.env.DATABASE_URL);
app.listen(PORT, () => {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log(`Server running on port ${PORT}`);
});
