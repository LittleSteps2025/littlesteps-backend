import eventModel from '../models/eventModel.js';
import pool from '../config/db.js';

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
      
      if (!date || !time || !description || !topic || !venue) {
        return res.status(400).json({ 
          message: 'Date, time, description, topic, and venue are required' 
        });
      }

      // Find a valid user_id for development
      let userIdNum = user_id;
      
      if (!userIdNum) {
        // Get the first available user from database
        console.log('🔍 Looking for available users...');
        const { rows } = await pool.query('SELECT user_id, name, email, role FROM "user" ORDER BY user_id LIMIT 3');
        console.log('📋 Found users:', rows);
        console.log('📋 First user details:', rows[0]);
        
        if (rows.length > 0) {
          userIdNum = rows[0].user_id;
          console.log('✅ Using user_id:', userIdNum, 'Type:', typeof userIdNum);
        } else {
          console.log('❌ No users found in database, creating test user...');
          
          // Create a test user for development
          const { rows: newUser } = await pool.query(`
            INSERT INTO "user" (name, email, role, nic, status, created_at) 
            VALUES ('System Admin', 'admin@littlesteps.com', 'admin', '999999999V', 'active', NOW()) 
            RETURNING user_id, name, email
          `);
          
          userIdNum = newUser[0].user_id;
          console.log('✅ Created test user:', newUser[0]);
          console.log('✅ Created test user with ID:', userIdNum, 'Type:', typeof userIdNum);
        }
      }

      // Validate that the user_id actually exists
      console.log('🔄 Validating user_id:', userIdNum, 'Type:', typeof userIdNum);
      const { rows: userCheck } = await pool.query('SELECT user_id, name, email FROM "user" WHERE user_id = $1', [userIdNum]);
      console.log('🔍 Validation query result:', userCheck);
      
      if (userCheck.length === 0) {
        console.log('❌ User ID does not exist:', userIdNum);
        
        // Let's see all users to debug
        const { rows: allUsers } = await pool.query('SELECT user_id, name, email FROM "user" LIMIT 5');
        console.log('📋 All users in database:', allUsers);
        
        return res.status(400).json({ 
          message: `User ID ${userIdNum} does not exist in database.`,
          debug: { 
            searchedUserId: userIdNum, 
            userIdType: typeof userIdNum,
            allUsers: allUsers 
          }
        });
      }
      
      console.log('✅ User ID validated:', userIdNum);

      const newEvent = await eventModel.create({ 
        user_id: userIdNum, 
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