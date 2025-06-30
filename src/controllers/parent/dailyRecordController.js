// src/controllers/parent/dailyRecordController.js
import { createDailyRecord } from '../../models/parent/dailyRecordModel.js'; // Correct import from model

const dailyRecordController = {
  createDailyRecord: async (req, res, next) => {
    const {
      breakfast, tea_time, lunch, snack_time, medicine, special_notes,
      childId, date // Ensure 'date' is destructured from req.body
    } = req.body;

    // Basic validation (adjust as needed for your specific requirements)
    if (!childId || (!breakfast && !tea_time && !lunch && !snack_time && !medicine && !special_notes && !date)) {
      return res.status(400).json({ message: 'Missing Information: Please provide at least one record detail (meal, medicine, notes) and a child ID, and a date.' });
    }

    const dailyRecordData = {
      childId,
      date: date || new Date().toISOString().slice(0, 10), // Use provided date or default to current date
      breakfast: breakfast || '',
      tea_time: tea_time || '',
      lunch: lunch || '',
      snack_time: snack_time || '',
      medicine: medicine || '',
      special_notes: special_notes || '',
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