import pool from '../config/db.js';

const GuardianModel = {
  getGuardiansByChildId: async (childId) => {
    const result = await pool.query(
      `SELECT g.id, g.name
       FROM guardian g
       JOIN "child-guardian" cg ON g.id = cg."guardianId"
       WHERE cg."childId" = $1
       ORDER BY g.name ASC`,
      [childId]
    );
    return result.rows;
  },

// Optionally, get all guardians (if needed)
  getAllGuardians: async () => {
    const result = await pool.query(`SELECT * FROM guardians`);
    return result.rows;
  },
};

export default GuardianModel;
