import AppointmentModel from '../../models/teacher/appointmentModel.js';

// Get all appointments for the logged-in teacher
export const getAppointments = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = currentUser.userId;
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

// Respond to a single appointment
export const respondToAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { response } = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!response || response.trim() === '') {
      return res.status(400).json({ message: 'Response cannot be empty.' });
    }

    const userId = currentUser.userId;
    const updated = await AppointmentModel.updateResponse(
      appointmentId,
      userId,
      response.trim()
    );

    if (!updated) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json({ message: 'Response submitted successfully!' });
  } catch (error) {
    console.error('Error responding to appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
