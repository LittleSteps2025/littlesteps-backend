import EventModel from '../../models/teacher/eventModel.js';

export const getAllEvents = async (req, res, next) => {
  try {
    const events = await EventModel.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  const { eventId } = req.params;
  try {
    const event = await EventModel.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};
