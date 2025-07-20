import pool from "../../config/db.js";
import bcrypt from 'bcrypt';

class ChildModel {
  async findAll() {
    // Join child, parent, and user tables to get child and parent info
    const query = `
      SELECT c.*, p.parent_id, u.user_id, u.name as parent_name, u.email as parent_email, u.phone as parent_phone, u.address as parent_address, u.nic as NIC, g.name as group_name, pkg.name as package_name
      FROM child c
      JOIN parent p ON c.parent_id = p.parent_id
      JOIN "user" u ON p.user_id = u.user_id
      JOIN "group" g ON c.group_id = g.group_id
      JOIN "package" pkg ON c.package_id = pkg.package_id
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
      name,
      age,
      gender,
      dob,
      group_name,
      image = null,
      bc = null,
      blood_type = null,
      mr = null,
      allergies = null,
      created_at = new Date(),
      package_name,
      parentName,
      parentNIC,
      parentEmail,
      parentAddress,
      parentContact,
    } = child;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const group_id = (
        await client.query(
          `
          SELECT group_id FROM "group" WHERE name = $1`,
          [group_name]
        )
      ).rows[0]?.group_id;

      const package_id = (
        await client.query(
          `SELECT package_id FROM "package" WHERE name = $1`,
          [package_name]
        )
      ).rows[0]?.package_id;

      // 1. Insert parent into 'user' table
      const userInsertQuery = `
        INSERT INTO "user" (nic, name, address, email, phone, image, role, created_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'parent', $7, 'active')
        RETURNING user_id
      `;
      const userResult = await client.query(userInsertQuery, [
        parentNIC,
        parentName,
        parentAddress,
        parentEmail,
        parentContact,
        image || null,
        created_at,
      ]);
      const userId = userResult.rows[0].user_id;

      const childCount = `
      UPDATE "group" SET child_count = child_count + 1 WHERE group_id = $1
      `;
      await client.query(childCount, [group_id]);

      // 2. Insert into 'parent' table
      const parentInsertQuery = `
        INSERT INTO parent (user_id, password, token, verified)
        VALUES ($1, NULL, NULL, false)
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
        parentId,
        name,
        age,
        gender,
        dob,
        group_id,
        image || null,
        bc,
        blood_type,
        mr,
        allergies,
        created_at,
        package_id,
      ]);

      await client.query("COMMIT");
      return childResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async update(child_id, child) {
    const {
      name,
      package_name,
      parentContact,
      parentAddress,
      created_at = new Date(),
    } = child;


    const packageQuery = `SELECT package_id FROM "package" WHERE name = $1`;
    const { rows: packageRows } = await pool.query(packageQuery, [package_name]);
    const package_id = packageRows.length > 0 ? packageRows[0].package_id : null;
    if (!group_id || !package_id) {
      throw new Error('Invalid group or package name');
    }
    const { rows } = await pool.query(
      `UPDATE child SET
          name = $1,
          package_id = $3,
          created_at = $4
       WHERE child_id = $5
       RETURNING *`,
      [
        name,
        package_id,
        created_at,
        child_id,
      ]
    );

    const updateParentQuery = `
      UPDATE "user"
      SET phone = $1, address = $2
      WHERE user_id = (SELECT user_id FROM parent WHERE parent_id = (SELECT parent_id FROM child WHERE child_id = $3))
    `;
    await pool.query(updateParentQuery, [parentContact, parentAddress, child_id]);

    return rows[0];
  }

  async remove(child_id) {
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      // First, get the child's group_id and parent_id before deletion
      const childInfoQuery = `
        SELECT group_id, parent_id FROM child WHERE child_id = $1
      `;
      const { rows: childInfo } = await client.query(childInfoQuery, [child_id]);
      
      if (childInfo.length === 0) {
        await client.query("ROLLBACK");
        return false; // Child not found
      }
      
      const { group_id, parent_id } = childInfo[0];
      
      // Check if this parent has other children
      const siblingCountQuery = `
        SELECT COUNT(*) as sibling_count FROM child 
        WHERE parent_id = $1 AND child_id != $2
      `;
      const { rows: siblingCount } = await client.query(siblingCountQuery, [parent_id, child_id]);
      const hasSiblings = parseInt(siblingCount[0].sibling_count) > 0;
      
      // Delete the child first (due to foreign key constraints)
      const { rowCount } = await client.query(
        "DELETE FROM child WHERE child_id = $1",
        [child_id]
      );
      
      if (rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      
      // Update group child count
      const updateGroupQuery = `
        UPDATE "group" SET child_count = child_count - 1 
        WHERE group_id = $1 AND child_count > 0
      `;
      await client.query(updateGroupQuery, [group_id]);
      
      // Only delete parent and user if this was the only child
      if (!hasSiblings) {
        // Get user_id before deleting parent
        const getUserQuery = `
          SELECT user_id FROM parent WHERE parent_id = $1
        `;
        const { rows: userInfo } = await client.query(getUserQuery, [parent_id]);
        
        if (userInfo.length > 0) {
          const user_id = userInfo[0].user_id;
          
          // Delete parent record
          await client.query("DELETE FROM parent WHERE parent_id = $1", [parent_id]);
          
          // Delete user record
          await client.query('DELETE FROM "user" WHERE user_id = $1', [user_id]);
        }
      }
      
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error removing child:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getGroups() {
    try {
      console.log("Fetching groups from database...");
      
      // Simplified query without child_count for now
      const query = 'SELECT name FROM "group" WHERE child_count < 5 ORDER BY group_id';
      console.log("Executing query:", query);
      
      const { rows } = await pool.query(query);
      console.log("Groups fetched successfully:", rows);
      return rows;
    } catch (error) {
      console.error("Error fetching groups:", error);
      console.error("Error details:", error.message);
      throw error;
    }
  }

  async getPackages() {
    try {
      console.log("Fetching packages from database...");

      // Simplified query without child_count for now
      const query = 'SELECT name FROM "package" ORDER BY package_id';
      console.log("Executing query:", query);
      
      const { rows } = await pool.query(query);
      console.log("Packages fetched successfully:", rows);
      return rows;
    } catch (error) {
      console.error("Error fetching packages:", error);
      console.error("Error details:", error.message);
      throw error;
    }
  }

  // Check if parent exists by email
  async checkParentByEmail(email) {
    const query = `
      SELECT u.*, p.parent_id, p.verified 
      FROM "user" u
      JOIN parent p ON u.user_id = p.user_id
      WHERE u.email = $1 AND u.role = 'parent'
    `;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  // Store parent verification token
  async storeParentToken(email, name, nic, token) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      // Hash the verification token for security
      const saltRounds = 12;
      const hashedToken = await bcrypt.hash(token, saltRounds);
      
      const tokenData = JSON.stringify({
        verification_token: hashedToken,
        expires_at: expiresAt.toISOString(),
        email: email,
        name: name,
        nic: nic
      });
      
      // Create user entry with 'inactive' status
      const tempUserQuery = `
        INSERT INTO "user" (nic, name, email, role, status, created_at)
        VALUES ($1, $2, $3, 'parent', 'inactive', NOW())
        RETURNING user_id
      `;
      
      const { rows: userRows } = await pool.query(tempUserQuery, [nic, name, email]);
      const userId = userRows[0].user_id;
      
      // Store in parent table with hashed token
      const parentQuery = `
        INSERT INTO parent (user_id, password, token, verified)
        VALUES ($1, NULL, $2, false)
        RETURNING *
      `;
      
      const { rows } = await pool.query(parentQuery, [userId, tokenData.verification_token]);
      return rows[0];
    } catch (error) {
      console.error("Error storing parent token:", error);
      throw error;
    }
  }

  // Verify parent token
  async verifyParentToken(email, token) {
    try {
      const query = `
        SELECT p.*, u.email, u.name, u.nic 
        FROM parent p
        JOIN "user" u ON p.user_id = u.user_id
        WHERE u.email = $1 AND p.verified = false AND p.token IS NOT NULL
      `;
      
      const { rows } = await pool.query(query, [email]);
      
      if (rows.length > 0) {
        const parentRecord = rows[0];
        
        try {
          const tokenData = JSON.parse(parentRecord.token);
          const expiresAt = new Date(tokenData.expires_at);
          
          // Check if token hasn't expired
          if (expiresAt > new Date()) {
            // Compare the plain text token with the hashed token using bcrypt
            const isTokenValid = await bcrypt.compare(token, tokenData.verification_token);
            
            if (isTokenValid) {
              // Mark parent as verified and clear token
              const updateQuery = `
                UPDATE parent 
                SET verified = true, token = NULL
                WHERE parent_id = $1
              `;
              await pool.query(updateQuery, [parentRecord.parent_id]);
              
              // Update user status to active
              const updateUserQuery = `
                UPDATE "user" 
                SET status = 'active'
                WHERE user_id = $1
              `;
              await pool.query(updateUserQuery, [parentRecord.user_id]);
              
              return true;
            }
          }
        } catch (parseError) {
          console.error("Error parsing token data:", parseError);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error verifying parent token:", error);
      throw error;
    }
  }

  // Create child with verified parent
  async createWithVerifiedParent(childData, parentId) {
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      const {
        name,
        age,
        gender,
        dob,
        group_name,
        package_name,
        image = null,
        bc = null,
        blood_type = null,
        mr = null,
        allergies = null,
        created_at = new Date()
      } = childData;

      // Get group_id and package_id
      const group_id = (
        await client.query(`SELECT group_id FROM "group" WHERE name = $1`, [group_name])
      ).rows[0]?.group_id;

      const package_id = (
        await client.query(`SELECT package_id FROM "package" WHERE name = $1`, [package_name])
      ).rows[0]?.package_id;

      if (!group_id || !package_id) {
        throw new Error('Invalid group or package name');
      }

      // Insert child
      const childInsertQuery = `
        INSERT INTO child
          (parent_id, name, age, gender, dob, group_id, image, bc, blood_type, mr, allergies, created_at, package_id)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const childResult = await client.query(childInsertQuery, [
        parentId,
        name,
        age,
        gender,
        dob,
        group_id,
        image,
        bc,
        blood_type,
        mr,
        allergies,
        created_at,
        package_id,
      ]);

      await client.query("COMMIT");
      return childResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

}

export default new ChildModel();
