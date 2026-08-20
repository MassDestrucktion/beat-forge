import { createUser } from './db/queries/users.js';
import { createProject } from './db/queries/projects.js';
import db from './db/client.js';
import crypto from 'crypto';

await db.connect();

// Delete all users to start fresh
await db.query('DELETE FROM users');

const user = await createUser('testuser', 'password');
console.log('Created user:', user);

const project = await createProject(
    crypto.randomUUID(),
    user.id,
    'My First Beat',
    120,
    [[]],
    [{}]
);
console.log('Created project:', project);

await db.end();
