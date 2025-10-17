import eventModel from '../models/eventModel.js';

const eventController = {
  async getAll(req, res, next) {
    try {
      const events = await eventModel.getAll();
      res.json(events);
    } catch (error) {
      next(error);
    }
  },

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const event = await eventModel.getById(id);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { user_id, image, date, time, description, topic, venue } = req.body;
      
      if (!user_id || !date || !time || !description || !topic || !venue) {
        return res.status(400).json({ 
          message: 'All fields are required except image' 
        });
      }

      const newEvent = await eventModel.create({ 
        user_id, 

        image: image || null, 
        date,
        time,
        description,
        topic,
        venue
      });
      res.status(201).json(newEvent);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { image, date, time, description, topic, venue } = req.body;

      if (!description && !date && !time && !topic && !venue) {
        return res.status(400).json({ 
          message: 'At least one field must be provided for update' 
        });
      }

      const updatedEvent = await eventModel.update(id, { 
        image: image || null,
        date: date || null,
        time: time || null,
        description: description || null,
        topic: topic || null,
        venue: venue || null
      });
      
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.json(updatedEvent);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedEvent = await eventModel.delete(id);
      
      if (!deletedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

export default eventController;