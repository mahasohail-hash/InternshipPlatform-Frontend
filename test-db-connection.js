// test-db-connection.js
const { Pool } = require('pg');
const path = require('path'); // Add this line

// Explicitly define the path to your .env.local file
require('dotenv').config({ path: path.resolve(__dirname, './.env.local') });

async function testConnection() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("ERROR: POSTGRES_URL is not defined in .env.local");
    // Add a check to confirm the file exists
    try {
      require('fs').accessSync(path.resolve(__dirname, './.env.local'));
      console.error(".env.local file exists, but POSTGRES_URL not found inside.");
    } catch (e) {
      console.error(".env.local file does NOT exist at the expected path.");
    }
    return;
  }

  // ... rest of your script
}

testConnection();