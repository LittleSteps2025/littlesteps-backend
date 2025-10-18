import dotenv from 'dotenv';
import pool from './src/config/db.js';

dotenv.config();

async function addCreatedAtToChild() {
  try {
    console.log('Checking child table for created_at column...');
    
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'child' 
      AND column_name = 'created_at'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('Adding created_at column to child table...');
      await pool.query(`
        ALTER TABLE child 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ created_at column added successfully!');
    } else {
      console.log('✅ created_at column already exists!');
    }
    
    // Check if column exists in complaint table
    const checkComplaintColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'complaint' 
      AND column_name = 'created_at'
    `);
    
    if (checkComplaintColumn.rows.length === 0) {
      console.log('Adding created_at column to complaint table...');
      await pool.query(`
        ALTER TABLE complaint 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ created_at column added to complaint table successfully!');
    } else {
      console.log('✅ created_at column already exists in complaint table!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCreatedAtToChild();
