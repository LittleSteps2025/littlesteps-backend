
import pool from "../../config/db.js"; // your PostgreSQL DB pool

const ReportModel = {
  getReportsByDate: async (date,userId) => {
    const result = await pool.query(
    //   `
    //   SELECT 
    //     report.*,
    //     child.name AS child_name,
    //     child.age As child_age,
    //     child.group_id as child_group 
    //   FROM report
    //   JOIN child ON report."child_id" = child.child_id
    //   WHERE DATE(report.create_date) = $1
    // `,



  `
  SELECT  
      report.*,  
      child.name AS child_name,  
      child.age AS child_age,  
      child.group_id AS child_group_id,  
      "group".name AS group_name  
  FROM report  
  JOIN child ON report.child_id = child.child_id  
  JOIN "group" ON child.group_id = "group".group_id  
  JOIN teacher ON "group".main_teacher_id = teacher.teacher_id  
  JOIN "user" ON teacher.user_id = "user".user_id  
  WHERE DATE(report.create_date) = $1 AND report.checkout_time IS NULL
    AND "user".user_id = $2;
  `,
  [date, userId]
);
    return result.rows;
  },



 getallReportsByDate: async (date) => {
    const result = await pool.query(
   `SELECT 
  report.*,
  child.name AS child_name,
  child.age AS child_age,
  g.name AS child_group
FROM report
JOIN child ON report.child_id = child.child_id
LEFT JOIN "group" g ON child.group_id = g.group_id
WHERE checkout_time is NULL AND DATE(report.create_date) = $1;`
,



  [date]
);
    return result.rows;
  },





  createReport: async (data) => {
    const {
      breakfast,
      morning_snack,
      lunch,
      evening_snack,
      medicine,
      child_id,
    } = data;
    const result = await pool.query(
      `INSERT INTO report (breakfast, morning_snack, lunch, evening_snack, medicine, "child_id") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [breakfast, morning_snack, lunch, evening_snack, medicine, child_id]
    );
    return result.rows[0];
  },

  getReportByChild_id: async (child_id) => {
    const result = await pool.query(
      `
  SELECT 
    report.*, 
    child.name AS child_name,
    child.age AS child_age,
    child.group_id AS child_group
  FROM report
  JOIN child ON report."child_id" = child.child_id
  WHERE report."child_id" = $1
`,
      [child_id]
    );

    return result.rows;
  },

  getReportByReport_id: async (report_id) => {
    const query = `
    SELECT r.*, c.name, c.age 
    FROM report r
    JOIN child c ON r.child_id = c.child_id
    WHERE r.report_id = $1
  `;

    const result = await pool.query(query, [report_id]);
    return result.rows[0]; // return one combined report with child info
  },

  updateArrivalTime: async (report_id, arrived_time) => {
    const result = await pool.query(
      `UPDATE report SET arrived_time = $1 WHERE report_id = $2 RETURNING *`,
      [arrived_time, report_id]
    );
    return result.rows[0];
  },

  updateStatusFields: async (report_id, statusFields) => {
    const columns = Object.keys(statusFields)
      .map((key, index) => {
        if (key === "progress" || key === "day_summery") {
          return `"${key}" = $${index + 1}`;
        } else {
          return `"${key}_status" = $${index + 1}`;
        }
      })
      .join(", ");

    const values = Object.values(statusFields);
    values.push(report_id); // for WHERE clause

    const query = `UPDATE report SET ${columns} WHERE report_id = $${values.length} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // reportModel.js
  updateReportDetails: async (
    child_id,
    { checkoutPerson, checkoutTime, dailySummary, progress }
  ) => {
    const now = new Date();
    const result = await pool.query(
      `UPDATE report
     SET checkout_person = $1,
         checkout_time = $2,
         day_summery = $3,
         progress = $4,
         created_date = $5
     WHERE "child_id" = $6
     RETURNING *`,
      [checkoutPerson, checkoutTime, dailySummary, progress, now, child_id]
    );
    return result.rows[0];
  },



//  submitReport: async (report_id, fieldsToUpdate) => {
//     // Map frontend keys to actual DB columns
//     const statusFieldMap = {
//       breakfirst: "breakfirst_status",
//       morning_snack: "morning_snack_status",
//       lunch: "lunch_status",
//       evening_snack: "evening_snack_status",
//       medicine: "medicine_status",
//     };

//     const updateColumns = [];
//     const values = [];

//     Object.entries(fieldsToUpdate).forEach(([key, value], index) => {
//       let columnName;

//       if (statusFieldMap[key]) {
//         columnName = statusFieldMap[key];
//       } else if (
//         key === "checkout_person" ||
//         key === "checkout_time" ||
//         key === "progress" ||
//         key === "day_summery" // typo as per your DB schema
//       ) {
//         columnName = key;
//       } else {
//         throw new Error(`Unknown field key: ${key}`);
//       }

//       updateColumns.push(`"${columnName}" = $${index + 1}`);
//       values.push(value);
//     });

//     // Add report_id for WHERE clause
//     values.push(report_id);

//     const query = `
//     UPDATE report
//     SET ${updateColumns.join(", ")}
//     WHERE report_id = $${values.length}
//     RETURNING *
//   `;

//     // For debugging:
//     console.log("SQL query:", query);
//     console.log("Values:", values);

//     const result = await pool.query(query, values);
//     return result.rows[0];
//   },



submitReport: async (report_id, fieldsToUpdate) => {
  // Map frontend keys to actual DB columns
  const statusFieldMap = {
    breakfirst: "breakfirst_status",
    morning_snack: "morning_snack_status",
    lunch: "lunch_status",
    evening_snack: "evening_snack_status",
    medicine: "medicine_status",
  };

  const updateColumns = [];
  const values = [];

  Object.entries(fieldsToUpdate).forEach(([key, value], index) => {
    let columnName;

    if (statusFieldMap[key]) {
      columnName = statusFieldMap[key];
    } else if (
      key === "checkout_person" ||
      key === "checkout_time" ||
      key === "progress" ||
      key === "day_summery" || // keep your typo as is to match DB column
      key === "teacher_id"      // <---- Add this key
    ) {
      columnName = key;
    } else {
      throw new Error(`Unknown field key: ${key}`);
    }

    updateColumns.push(`"${columnName}" = $${index + 1}`);
    values.push(value);
  });

  // Add report_id for WHERE clause
  values.push(report_id);

  const query = `
    UPDATE report
    SET ${updateColumns.join(", ")}
    WHERE report_id = $${values.length}
    RETURNING *
  `;

  // Debugging logs (optional)
  console.log("SQL query:", query);
  console.log("Values:", values);

  const result = await pool.query(query, values);
  return result.rows[0];
}

  











  

  
};

export default ReportModel;
