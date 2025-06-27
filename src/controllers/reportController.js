import ReportModel from '../models/reportModel.js';


export const getReports = async (req, res, next) => {
  try {
    const reports = await ReportModel.getAllReports();
    res.status(200).json(reports);
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
  const { childId } = req.params;
  try {
    const report = await ReportModel.getReportByChildId(childId);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};



export const updateArrivalTime = async (req, res, next) => {
  const { childId } = req.params;
  const { arrived_time } = req.body;

  try {
    const updated = await ReportModel.updateArrivalTime(childId, arrived_time);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateStatusFields = async (req, res, next) => {
  const { childId } = req.params;
  const statusFields = req.body;

  try {
    const updated = await ReportModel.updateStatusFields(childId, statusFields);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};


// reportController.js
export const submitReport = async (req, res, next) => {
  const { childId } = req.params;
  const { statusUpdates, checkoutPerson, checkoutTime, dailySummary, progress } = req.body;

  try {
    // 1. Update status fields
    await ReportModel.updateStatusFields(childId, statusUpdates);

    // 2. Update checkout info, daily summary and progress
    await ReportModel.updateReportDetails(childId, {
      checkoutPerson,
      checkoutTime,
      dailySummary,
      progress,
    });

    res.status(200).json({ message: "Report submitted successfully" });
  } catch (error) {
    next(error);
  }
};





