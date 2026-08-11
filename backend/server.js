import "dotenv/config";
import app from "./app.js";


const PORT = process.env.PORT || 3000;
console.log(process.env.DATABASE_CONNECTION)
app.listen(PORT, () => {
  console.log(process.env.DATABASE_CONNECTION)
  console.log(`Server running on port ${PORT}`);
});