import GuardianModel from '../models/guardianModel.js';

export const getGuardiansByChildId = async (req, res, next) => {
  const { childId } = req.params;
  try {
    const guardians = await GuardianModel.getGuardiansByChildId(childId);
    res.status(200).json(guardians);
  } catch (error) {
    next(error);
  }
};

export const getAllGuardians = async (req, res, next) => {
  try {
    const guardians = await GuardianModel.getAllGuardians();
    res.status(200).json(guardians);
  } catch (error) {
    next(error);
  }
};


