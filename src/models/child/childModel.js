import pool from '../../config/db.js';

class ChildModel {
  async findAll() {
    // Join child, parent, and user tables to get child and parent info
    const query = `
      SELECT c.*, p.parent_id, u.user_id, u.name as parent_name, u.email as parent_email, u.phone as parent_phone, u.address as parent_address
      FROM child c
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      ORDER BY c.child_id DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async checkParentByNIC(nic) {
    const query = `
      SELECT * FROM "user" WHERE nic = $1 AND role = 'parent'
    `;
    const { rows } = await pool.query(query, [nic]);
    return rows[0];
  }

  async findById(child_id) {
    // Join child, parent, and user tables for single child
    const query = `
      SELECT c.*, p.parent_id, u.user_id, u.name as parent_name, u.email as parent_email, u.phone as parent_phone, u.address as parent_address
      FROM child c
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      WHERE c.child_id = $1
    `;
    const { rows } = await pool.query(query, [child_id]);
    return rows[0];
  }

  async create(child) {
    const {
      name, age, gender, dob, group_id, image,
      bc = null, blood_type = null, mr = null, allergies = null,
      created_at, package_id = null,
      parentName, parentNIC, parentEmail, parentAddress, parentContact
    } = child;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert parent into 'user' table
      const userInsertQuery = `
        INSERT INTO "user" (nic, name, address, email, phone, image, role, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'parent', $7, 'active')
        RETURNING user_id
      `;
      const userResult = await client.query(userInsertQuery, [
        parentNIC, parentName, parentAddress, parentEmail, parentContact,
        image || null, created_at
      ]);
      const userId = userResult.rows[0].user_id;

      // 2. Insert into 'parent' table
      const parentInsertQuery = `
        INSERT INTO parent (user_id, password, token, verified)
        VALUES ($1, 'default_hashed_password', NULL, false)
        RETURNING parent_id
      `;
      const parentResult = await client.query(parentInsertQuery, [userId]);
      const parentId = parentResult.rows[0].parent_id;

      // 3. Insert into 'child' table
      const childInsertQuery = `
        INSERT INTO child
          (parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const childResult = await client.query(childInsertQuery, [
        parentId, name, age, gender, dob, group_id, image || null,
        bc, blood_type, mr, allergies, created_at, package_id
      ]);

      await client.query('COMMIT');
      return childResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(child_id, child) {
    const {
      name, age, gender, dob, group_id, image, bc, blood_type,
      mr, allergies, created_at, package_id
    } = child;

    const { rows } = await pool.query(
      `UPDATE child SET
          name = $1,
          age = $2,
          gender = $3,
          dob = $4,
          group_id = $5,
          image = $6,
          bc = $7,
          blood_type = $8,
          mr = $9,
          allergies = $10,
          created_at = $11,
          package_id = $12
       WHERE child_id = $13
       RETURNING *`,
      [name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id, child_id]
    );

    return rows[0];
  }

  async remove(child_id) {
    const { rowCount } = await pool.query('DELETE FROM child WHERE child_id = $1', [child_id]);
    return rowCount > 0;
  }
}

export default new ChildModel();