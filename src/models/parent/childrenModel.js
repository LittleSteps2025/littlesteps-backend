import pool from '../../config/db.js';

export const getAllChildren = async (parentUserId) => {
    try {
        // First, get the parent_id from the parent table using user_id
        const parentQuery = `SELECT parent_id FROM parent WHERE user_id = $1`;
        const parentResult = await pool.query(parentQuery, [parentUserId]);

        if (parentResult.rows.length === 0) {
            throw new Error('No parent found for this user ID');
        }

        const parentId = parentResult.rows[0].parent_id;
        
        // Then, get all children for this parent
        const childrenQuery = `SELECT * FROM child WHERE parent_id = $1`;
        const childrenResult = await pool.query(childrenQuery, [parentId]);

        if (childrenResult.rows.length === 0) {
            return []; // Return empty array instead of false for consistency
        }
        
        return childrenResult.rows;

    } catch (error) {
        console.error('Error fetching children:', error);
        throw error;
    }
};