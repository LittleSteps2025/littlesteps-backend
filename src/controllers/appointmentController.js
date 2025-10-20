import AppointmentModel from '../models/appointmentModel.js';

class AppointmentController {
  async getAppointments(req, res) {
    try {
      const appointments = await AppointmentModel.findAllBySupervisor();
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createAppointment(req, res) {
    try {
      const appointment = await AppointmentModel.create(req.body);
      res.status(201).json(appointment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  
}

export default new AppointmentController();
