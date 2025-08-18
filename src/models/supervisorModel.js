import pool from '../config/db.js';


export const getParentByNic = async (nic) =>{
    const query = `SELECT u.*, p.parent_id FROM "user" u JOIN parent p ON u.user_id = p.user_id WHERE nic = $1 AND role = 'parent'`;
    const { rows } = await pool.query(query, [nic]);
    console.log("Parent found by NIC:", rows);
    return rows[0];
}

