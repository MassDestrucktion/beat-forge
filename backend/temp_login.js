import { userLogin } from './db/queries/users.js';
import { createToken } from './jwt/jwt.js';
import db from './db/client.js';

await db.connect();
const user = await userLogin('testDee', '1234');
const token = await createToken({ id: user.id });
console.log(JSON.stringify({ user, token }));
await db.end();
