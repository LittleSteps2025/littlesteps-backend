import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    // Read SQL files
    const dataPath = path.join(__dirname, '..', 'data', 'data.sql');
    const complaintsPath = path.join(__dirname, '..', 'data', 'complaints.sql');
    
    const dataScript = fs.readFileSync(dataPath, 'utf8');
    const complaintsScript = fs.readFileSync(complaintsPath, 'utf8');

    // Connect to database and execute SQL
    console.log('Setting up database...');
    await pool.query(dataScript);
    console.log('Setting up complaints table...');
    await pool.query(complaintsScript);
    
    // Add test complaints
    const complaintSeedsPath = path.join(__dirname, 'seeds', 'complaint_seeds.sql');
    const complaintSeedsScript = fs.readFileSync(complaintSeedsPath, 'utf8');
    console.log('Adding test complaints...');
    await pool.query(complaintSeedsScript);
    console.log('Database setup completed successfully');

    // Test connection by querying subscriptions
    const result = await pool.query('SELECT * FROM subscriptions');
    console.log('Current subscriptions:', result.rows);

  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run setup
setupDatabase()
  .then(() => console.log('Setup completed'))
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });