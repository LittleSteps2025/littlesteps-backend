// src/models/reportModel.js

import pool from "../config/db.js"; // your PostgreSQL DB pool

const ReportModel = {
  getAllReports: async () => {
    const result = await pool.query(`
      SELECT 
        report.*,
        children.name AS child_name,
        children.age AS child_age,
        children.group AS child_group
      FROM report
      JOIN children ON report."childId" = children.id
    `);
    return result.rows;
  },

  createReport: async (data) => {
    const { breakfast, tea_time, lunch, snack_time, medicine, childId } = data;
    const result = await pool.query(
      `INSERT INTO report (breakfast, tea_time, lunch, snack_time, medicine, "childId") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [breakfast, tea_time, lunch, snack_time, medicine, childId]
    );
    return result.rows[0];
  },

  getReportByChildId: async (childId) => {
    const result = await pool.query(
      `
  SELECT 
    report.*, 
    children.name AS child_name,
    children.age AS child_age,
    children.group AS child_group
  FROM report
  JOIN children ON report."childId" = children.id
  WHERE report."childId" = $1
`,
      [childId]
    );

    return result.rows;
  },


 updateArrivalTime: async (childId, arrived_time) => {
  const result = await pool.query(
    `UPDATE report SET arrived_time = $1 WHERE "childId" = $2 RETURNING *`,
    [arrived_time, childId]
  );
  return result.rows[0];
},


// updateStatusFields: async (childId, statusFields) => {
//   const columns = Object.keys(statusFields)
//     .map((key, index) => `"${key}_status" = $${index + 1}`)
//     .join(", ");

//   const values = Object.values(statusFields);
//   values.push(childId); // Add childId for the WHERE clause

//   const result = await pool.query(
//     `UPDATE report SET ${columns} WHERE "childId" = $${values.length} RETURNING *`,
//     values
//   );

//   return result.rows[0];
// },







updateStatusFields: async (childId, statusFields) => {
  const columns = Object.keys(statusFields)
    .map((key, index) => {
      if (key === 'progress') {
        return `"progress" = $${index + 1}`;
      } else {
        return `"${key}_status" = $${index + 1}`;
      }
    })
    .join(", ");

  const values = Object.values(statusFields);
  values.push(childId); // For WHERE clause

  const result = await pool.query(
    `UPDATE report SET ${columns} WHERE "childId" = $${values.length} RETURNING *`,
    values
  );

  return result.rows[0];
},





// reportModel.js
updateReportDetails: async (childId, { checkoutPerson, checkoutTime, dailySummary, progress }) => {
  const now = new Date();
  const result = await pool.query(
    `UPDATE report
     SET checkout_person = $1,
         checkout_time = $2,
         day_summery = $3,
         progress = $4,
         created_date = $5
     WHERE "childId" = $6
     RETURNING *`,
    [checkoutPerson, checkoutTime, dailySummary, progress, now, childId]
  );
  return result.rows[0];
},










};

export default ReportModel;
