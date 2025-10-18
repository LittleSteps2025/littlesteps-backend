// models/userModel.js
import pool from '../../config/db.js';

const ProfileModel = {
  // Get profile details by userId
  getUserById: async (userId) => {
    const result = await pool.query(
      `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.image,
        u.phone,
        u.role,
        u.address,
        u.nic,
        t.teacher_id,
        -- groups where teacher is main
        COALESCE(STRING_AGG(DISTINCT g1.name, ', '), '') AS main_group,
        -- groups where teacher is co
        COALESCE(STRING_AGG(DISTINCT g2.name, ', '), '') AS co_group
      FROM "user" u
      LEFT JOIN teacher t 
        ON u.user_id = t.user_id
      LEFT JOIN "group" g1 
        ON g1.main_teacher_id = t.teacher_id
      LEFT JOIN "group" g2 
        ON g2.co_teacher_id = t.teacher_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, u.name, u.email, u.phone, u.role, u.nic, t.teacher_id, u.address
      `,
      [userId]
    );

    return result.rows[0];
  },

  // Update profile by userId
  updateUserProfile: async (userId, { phone, address, profileImage }) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (phone) {
      fields.push(`phone = $${idx}`);
      values.push(phone);
      idx++;
    }

    if (address) {
      fields.push(`address = $${idx}`);
      values.push(address);
      idx++;
    }

    if (profileImage) {
      fields.push(`image = $${idx}`);
      values.push(profileImage);
      idx++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE "user"
      SET ${fields.join(', ')}
      WHERE user_id = $${idx}
      RETURNING *
    `;
    values.push(userId);

    const result = await pool.query(query, values);
    return result.rows[0];
  },
};

export default ProfileModel;
