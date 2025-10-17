// src/controllers/parent/dailyRecordController.js
import { createDailyRecord } from '../../models/parent/dailyRecordModel.js'; // Correct import from model

const dailyRecordController = {
  createDailyRecord: async (req, res, next) => {
    const {
      breakfirst, morning_snack, lunch, evening_snack, medicine, special_note,
      child_id, date // Ensure 'date' is destructured from req.body
    } = req.body;

    // Basic validation (adjust as needed for your specific requirements)
    if (!child_id || (!breakfirst && !morning_snack && !lunch && !evening_snack && !medicine && !special_note && !date)) {
      return res.status(400).json({ message: 'Missing Information: Please provide at least one record detail (meal, medicine, notes) and a child ID, and a date.' });
    }

    const dailyRecordData = {
      child_id,
      create_date: date || new Date().toISOString().slice(0, 10), // Use provided date or default to current date
      breakfirst: breakfirst || '',
      morning_snack: morning_snack || '',
      lunch: lunch || '',
      evening_snack: evening_snack || '',
      medicine: medicine ? true : false, // Convert to boolean
      special_note: special_note || '',
    };

    try {
      const newRecord = await createDailyRecord(dailyRecordData);
      res.status(201).json({ message: 'Daily record saved successfully!', record: newRecord });
    } catch (error) {
      console.error('Controller error creating daily record:', error);
      next(error); // Pass the error to the error handling middleware
    }
  },
};

export default dailyRecordController;