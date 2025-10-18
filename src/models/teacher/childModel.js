// models/teacher/childModel.js

import pool from '../../config/db.js'; // Adjust path if needed

const ChildModel = {
  // ✅ Get children by filters (group, package, month)
  async getFilteredChildren(group = 'all', pkg = 'all', month) {
    let query = `
      SELECT DISTINCT ON (c.child_id)
        c.child_id AS id,
        c.name,
        c.age,
        c.gender,
        g.name AS group,
        CASE
          WHEN p.package_id IS NOT NULL THEN pk.name
          ELSE NULL
        END AS package
      FROM child c
      LEFT JOIN "group" g ON c.group_id = g.group_id
      LEFT JOIN payment p ON c.child_id = p.child_id AND p.month = $1
      LEFT JOIN package pk ON p.package_id = pk.package_id
      WHERE 1=1
    `;

    const values = [month];
    let index = 2;

    if (group !== 'all') {
      query += ` AND g.name = $${index++}`;
      values.push(group);
    }

    if (pkg !== 'all') {
      query += ` AND pk.name = $${index++}`;
      values.push(pkg);
    }

    const result = await pool.query(query, values);
    return result.rows;
  },

  // ✅ Get full child record by ID
  async getChildById(childId) {
    const query = `
    SELECT 
      c.*,
        TO_CHAR(c.dob, 'YYYY-MM-DD') AS dob,

      g.name AS group_name,
      u.name AS parent_name,
      u.phone AS parent_phone,
      u.address AS address
      
    FROM child c
    LEFT JOIN "group" g ON c.group_id = g.group_id
    LEFT JOIN parent p ON c.parent_id = p.parent_id
    LEFT JOIN "user" u ON p.user_id = u.user_id
    WHERE c.child_id = $1
  `;
    const result = await pool.query(query, [childId]);
    return result.rows[0];
  },



  // ✅ Get all children with their parent info (list view)
  async getChildrenWithParents() {
    const query = `
      SELECT 
        c.child_id AS id,
        c.name,
        c.age,
        c.gender,
        g.name AS group,
        c.contact_no,
        p.name AS parent_name,
        p.phone AS parent_phone,
        p.relationship
      FROM child c
      LEFT JOIN "group" g ON c.group_id = g.group_id
      LEFT JOIN parent p ON c.parent_id = p.parent_id
      ORDER BY c.name
    `;
    const result = await pool.query(query);
    return result.rows;
  },




  async getSensitiveData(childId) {
  // ✅ Fetch sensitive info from child table
  const childResult = await pool.query(
    'SELECT blood_type, allergies FROM child WHERE child_id = $1',
    [childId]
  );

  // ✅ Fetch medical records for the child
  const medicalResult = await pool.query(
    'SELECT type, title, description FROM medical_records WHERE child_id = $1',
    [childId]
  );

  return {
    blood_type: childResult.rows[0]?.blood_type || null,
    allergies: childResult.rows[0]?.allergies || null,
    medical_records: medicalResult.rows || [],
  };
},

};








export default ChildModel;
