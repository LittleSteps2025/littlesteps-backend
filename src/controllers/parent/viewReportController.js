import * as DailyRecord from '../../models/parent/viewReportModel.js';

export const getDailyRecordByChildAndDate = async (req, res) => {
  try {
    const { child_id, date } = req.query;
    if (!child_id || !date) {
      return res.status(400).json({ message: 'child_id and date are required' });
    }

    const records = await DailyRecord.getMealRecordsByChildAndDate(child_id, date);
    res.json({ data: records });
  } catch (err) {
    console.error('Error fetching meal records by child and date:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllDailyRecordsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    const records = await DailyRecord.getAllMealRecordsByDate(date);
    res.json({ data: records });
  } catch (err) {
    console.error('Error fetching all daily records:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
