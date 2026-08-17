
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../.env") });

import { createUser } from './db/queries/users.js';
import { createProject } from './db/queries/projects.js';
import { randomUUID } from 'crypto';

async function testSave() {
  try {
    // Create a user
    const username = 'testuser_from_script';
    const password = 'password';
    const user = await createUser(username, password);
    console.log('User created:', user);

    // Create a project for the user
    const project = await createProject(
      randomUUID(),
      user.id,
      'Test Project from Script',
      120,
      { key: 'value' },
      { key: 'value' }
    );
    console.log('Project created:', project);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSave();
