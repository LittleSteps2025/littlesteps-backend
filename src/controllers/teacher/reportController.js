import ReportModel from '../../models/teacher/reportModel.js';
import pool from '../../config/db.js'; // For raw SQL queries


export const getReports = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // e.g., '2025-07-03'
    const reports = await ReportModel.getReportsByDate(today);
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

//for daily report form
export const getReportByReportId = async (req, res, next) => {
  const { report_id } = req.params;
  try {
    const report = await ReportModel.getReportByReport_id(report_id); // 👈 update model
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};


export const createReport = async (req, res, next) => {
    try {
        const newReport = await ReportModel.createReport(req.body);
        res.status(201).json(newReport);
    } catch (error) {
        next(error);
    }
};
export const getReportByChildId = async (req, res, next) => {
  const { child_id } = req.params;
  try {
    const report = await ReportModel.getReportByChild_id(child_id);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};



export const updateArrivalTime = async (req, res, next) => {
  const { report_id } = req.params;
  const { arrived_time } = req.body;

  try {
    const updated = await ReportModel.updateArrivalTime(report_id, arrived_time);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};


export const updateStatusFields = async (req, res, next) => {
  const { report_id } = req.params;
  const statusFields = req.body;

  try {
    const updated = await ReportModel.updateStatusFields(report_id, statusFields);
    res.status(200).json({ message: "Report updated successfully", updated });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ message: "Failed to update report", error: error.message });
  }
};





// export const submitReport = async (req, res) => {
//   const { report_id } = req.params;
//   const {
//     statusUpdates,
//     checkoutPerson,
//     checkoutTime,  // expects time string like "15:45"
//     progress,
//     dailySummary,
//   } = req.body;

//   try {
//     // Convert time string "HH:mm" into full timestamp "YYYY-MM-DD HH:mm:ss"
//     let fullCheckoutTime = null;
//     if (checkoutTime) {
//       const today = new Date().toISOString().split("T")[0]; // e.g. "2025-07-06"
//       fullCheckoutTime = `${today} ${checkoutTime}:00`; // e.g. "2025-07-06 15:45:00"
//     }

//     // Merge all updates into one object for `submitReport` model method
//     const fieldsToUpdate = {
//       ...statusUpdates,
//       checkout_person: checkoutPerson,
//       checkout_time: fullCheckoutTime,
//       progress,
//       day_summery: dailySummary,
//     };

//     const updatedReport = await ReportModel.submitReport(
//       report_id,
//       fieldsToUpdate
//     );

//     res.status(200).json({
//       message: "Report submitted successfully",
//       report: updatedReport,
//     });
//   } catch (error) {
//     console.error("Error submitting report:", error);
//     res.status(500).json({ error: "Failed to submit report" });
//   }
// };






//meke chekout time case
// export const submitReport = async (req, res) => {
//   const { report_id } = req.params;
//   const {
//     statusUpdates,
//     checkoutPerson,
//     checkoutTime,  // expects time string like "15:45"
//     progress,
//     dailySummary,
//   } = req.body;

//   // Get current user info from req.user (set by authentication middleware)
//   const currentUser = req.user;  // e.g. { userId, email }

//   if (!currentUser) {
//     return res.status(401).json({ error: "Unauthorized: User not authenticated" });
//   }

//   try {
//     // Convert time string "HH:mm" into full timestamp "YYYY-MM-DD HH:mm:ss"
//     let fullCheckoutTime = null;
//     if (checkoutTime) {
//       const today = new Date().toISOString().split("T")[0]; // e.g. "2025-07-06"
//       fullCheckoutTime = `${today} ${checkoutTime}:00`; // e.g. "2025-07-06 15:45:00"
//     }

//     // Merge all updates into one object for submitReport model method
//     const fieldsToUpdate = {
//       ...statusUpdates,
//       checkout_person: checkoutPerson,
//       checkout_time: fullCheckoutTime,
//       progress,
//       day_summery: dailySummary,
//       teacher_id: currentUser.userId || currentUser.email,  // Add current user info here
//     };

//     const updatedReport = await ReportModel.submitReport(report_id, fieldsToUpdate);

//     res.status(200).json({
//       message: "Report submitted successfully",
//       report: updatedReport,
//     });
//   } catch (error) {
//     console.error("Error submitting report:", error);
//     res.status(500).json({ error: "Failed to submit report" });
//   }
// };





export const submitReport = async (req, res) => {
  const { report_id } = req.params;
  const {
    statusUpdates,
    checkoutPerson,
    checkoutTime,  // can be "HH:mm" or full ISO datetime string
    progress,
    dailySummary,
  } = req.body;

  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({ error: "Unauthorized: User not authenticated" });
  }

  try {
    // ✅ Get teacher_id for the logged-in user
    const teacherRes = await pool.query(
      'SELECT teacher_id FROM teacher WHERE user_id = $1',
      [currentUser.userId]
    );

    if (teacherRes.rows.length === 0) {
      return res.status(403).json({ error: "Teacher not found for this user" });
    }

    const teacherId = teacherRes.rows[0].teacher_id;

    // ✅ Handle checkout time formatting
    let fullCheckoutTime = null;

    if (checkoutTime) {
      if (/^\d{2}:\d{2}$/.test(checkoutTime)) {
        const today = new Date().toISOString().split("T")[0];
        fullCheckoutTime = `${today} ${checkoutTime}:00`;
      } else {
        const dt = new Date(checkoutTime);
        if (isNaN(dt.getTime())) {
          return res.status(400).json({ error: "Invalid checkoutTime format" });
        }
        fullCheckoutTime = dt.toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    const fieldsToUpdate = {
      ...statusUpdates,
      checkout_person: checkoutPerson,
      checkout_time: fullCheckoutTime,
      progress,
      day_summery: dailySummary,
      teacher_id: teacherId,   // ✅ Pass correct teacher_id here
    };

    const updatedReport = await ReportModel.submitReport(report_id, fieldsToUpdate);

    res.status(200).json({
      message: "Report submitted successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
};





