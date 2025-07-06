import pool from '../../config/db.js';

const GuardianModel = {
  getGuardiansByChildId: async (childId) => {
    const result = await pool.query(
      `SELECT name
       FROM guardian
       WHERE parent_id = (
         SELECT parent_id FROM child WHERE child_id = $1
       )
       ORDER BY name ASC`,
      [childId]
    );
    return result.rows;  // array of guardians with { name }
  },



// Optionally, get all guardians (if needed)
  getAllGuardians: async () => {
    const result = await pool.query(`SELECT * FROM guardian`);
    return result.rows;
  },
};

export default GuardianModel;
