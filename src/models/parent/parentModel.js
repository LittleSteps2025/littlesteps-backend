import pool from '../../config/db.js';

export const getParentByEmail = async (email) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND role = $2', 
            [email, 'parent']
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching parent:', error);
        throw error;
    }
};

export const createParent = async (userData) => {
    try {
        const { name, email, password, phone_number } = userData;
        
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, password, 'parent', phone_number]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creating parent:', error);
        throw error;
    }
};