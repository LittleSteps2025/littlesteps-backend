import pool from '../config/db.js';

const createUserTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            verified BOOLEAN DEFAULT FALSE,
            role VARCHAR(20) CHECK (role IN ('parent', 'admin', 'supervisor', 'teacher')),
            phone_number VARCHAR(15),
            is_active BOOLEAN DEFAULT TRUE,
            token INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS gardian (
            gardian_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            gardian_type VARCHAR(10) CHECK (gardian_type IN ('mother', 'father', 'other')),
            phone_number VARCHAR(15) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS parent (
            parent_id INTEGER PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            address VARCHAR(255),
            emergency_contact VARCHAR(15),
            gardian_id INTEGER REFERENCES gardian(gardian_id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()          
        );
    `;

    try {
        await pool.query(query);
        console.log('User table created successfully');
    } catch (error) {
        console.error('Error creating user table:', error);
    }
}

export default createUserTable;