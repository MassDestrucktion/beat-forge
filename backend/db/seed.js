import db from "./client.js";

import { createUser } from "./queries/users.js";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
    await db.query('DELETE FROM users');
    await createUser("testDee", "1234");
    await createUser("testJacob", "5678");
    await createUser("testJohn", "abcd");
    console.log("Cool Cool");
}