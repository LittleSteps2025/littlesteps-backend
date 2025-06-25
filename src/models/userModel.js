import { pool } from '../config/db.js';

// Create a new user
export const createUserService = async (userData) => {
    const { name, email, firebase_uid, profile_picture, phone } = userData;
    
    const query = `
        INSERT INTO users (firebase_uid, email, name, profile_picture, phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *;
    `;
    
    const values = [firebase_uid, email, name, profile_picture, phone];
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Get all users with pagination
export const getAllUsersService = async ({ limit = 50, offset = 0 }) => {
    const query = `
        SELECT id, firebase_uid, email, name, profile_picture, phone, created_at, last_login, is_active
        FROM users 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2;
    `;
    
    try {
        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
};

// Get user by ID
export const getUserByIdService = async (userId) => {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
    
    try {
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
    }
};

// Get user by Firebase UID
export const getUserByFirebaseUIDService = async (firebaseUID) => {
    const query = 'SELECT * FROM users WHERE firebase_uid = $1 AND is_active = true';
    
    try {
        const result = await pool.query(query, [firebaseUID]);
        return result.rows[0];
    } catch (error) {
        console.error('Error getting user by Firebase UID:', error);
        throw error;
    }
};

// Update user by ID
export const updateUserService = async (userId, updateData) => {
    const allowedFields = ['name', 'email', 'phone', 'profile_picture'];
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }
    
    const query = `
        UPDATE users 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND is_active = true
        RETURNING *;
    `;
    values.push(userId);
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// Delete user (soft delete)
export const deleteUserService = async (userId) => {
    const query = `
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *;
    `;
    
    try {
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// Sync Firebase user with database (upsert operation)
export const syncFirebaseUserService = async (firebaseUser) => {
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
        console.error('Error syncing Firebase user:', error);
        throw error;
    }
};

// Update user by Firebase UID (for Firebase integration)
export const updateUserByFirebaseUIDService = async (firebaseUID, updateData) => {
    const allowedFields = ['name', 'phone', 'profile_picture'];
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
            paramCount++;
        }
    });
    
    if (fields.length === 0) {
        throw new Error('No valid fields to update');
    }
    
    const query = `
        UPDATE users 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE firebase_uid = $${paramCount} AND is_active = true
        RETURNING *;
    `;
    values.push(firebaseUID);
    
    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating user by Firebase UID:', error);
        throw error;
    }
};