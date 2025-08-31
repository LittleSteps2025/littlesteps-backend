import AppointmentModel from '../../models/teacher/appointmentModel.js';

export const getAppointments = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = currentUser.userId;
    console.log("User ID:", userId);
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found' });
    }

    const appointments = await AppointmentModel.getAppointmentsByUserId(userId);
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    next(error);
  }
};
