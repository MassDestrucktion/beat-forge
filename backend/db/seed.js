import db from "./client";

import { createUser } from "./queries/users";
import { createTrack } from "./queries/tracks";
import { createProject } from "./queries/projects";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
    await createUser("testDee", 1234);
    await createUser("testJacob", 5678);
    await createUser("testJohn", "abcd");
    console.log("Cool Cool");
}