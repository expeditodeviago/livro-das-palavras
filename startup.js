/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'dev.db');
const dbUrl = `file:${dbPath}`;

console.log(`Starting deployment... Using database URL: ${dbUrl}`);

try {
  // Push the schema to the database (creates tables)
  execSync(`npx prisma db push --accept-data-loss`, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: 'inherit'
  });
  
  // Seed the database with words
  execSync(`npx tsx prisma/seed.ts`, {
    stdio: 'inherit'
  });
} catch (error) {
  console.error("Database initialization failed:", error);
  process.exit(1);
}
