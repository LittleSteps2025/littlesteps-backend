import pool from "../../config/db.js";

const GuardianModel = {
  getGuardiansByChildId: async (childId) => {
    const result = await pool.query(
   `
      SELECT u.name AS name
      FROM child c
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.child_id = $1

      UNION

      SELECT g.name AS name
      FROM guardian g
      WHERE g.parent_id = (
        SELECT parent_id FROM child WHERE child_id = $1
      )
      ORDER BY name ASC
      `, [childId]
    );
    return result.rows; // array of guardians with { name }
  },

  // Optionally, get all guardians (if needed)
  getAllGuardians: async () => {
    const result = await pool.query(`SELECT * FROM guardian`);
    return result.rows;
  },
};

export default GuardianModel;
