import pool from '../config/db.js';

const initializeDatabase = async () => {
    try {
        // Create users table if it doesn't exist
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                firebase_uid VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                profile_picture TEXT,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );
        `;
        
        // Create indexes for better performance
        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
        `;
        
        // Create trigger to update updated_at timestamp
        const createTrigger = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;
        
        await pool.query(createUsersTable);
        await pool.query(createIndexes);
        await pool.query(createTrigger);
        
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Sync Firebase user with database
const syncUser = async (firebaseUser) => {
    const query = `
        INSERT INTO users (firebase_uid, email, name, profile_picture, last_login, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (firebase_uid) 
        DO UPDATE SET 
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            profile_picture = EXCLUDED.profile_picture,
            last_login = NOW(),
            updated_at = NOW()
        RETURNING *;
    `;
    
    const values = [
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.name || firebaseUser.displayName,
        firebaseUser.photoURL || firebaseUser.picture
    ];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error syncing user:', error);
        throw error;
    }
};

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Database connection test successful:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};

export { initializeDatabase, syncUser, testConnection };