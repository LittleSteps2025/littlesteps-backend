// File: controllers/child/childController.js
import childModel from '../../models/child/childModel.js';

class ChildController {
    async getAll(req, res) {
        try {
            const children = await childModel.findAll();
            res.status(200).json(children);
        } catch (error) {
            console.error('Error retrieving children:', error);
            res.status(500).json({ message: 'Error retrieving children', error: error.message });
        }
    }
    async checkVerifiedParent(req, res) {
        try{
            const { nic } = req.body;
            if (!nic) {
                return res.status(400).json({ message: 'NIC is required' });
            }

            const parent = await childModel.checkParentByNIC(nic);
            if (parent) {
                return res.status(200).json({ verified: true, parent });
            } else {
                return res.status(404).json({ verified: false, message: 'Parent not found' });
            }
        }catch (error) {
            console.error('Error checking verified parent:', error);
            res.status(500).json({ message: 'Error checking verified parent', error: error.message });
        }
    }

    async getById(req, res) {
        const { id } = req.params;
        try {
            const child = await childModel.findById(id);
            if (child) {
                res.status(200).json(child);
            } else {
                res.status(404).json({ message: 'Child not found' });
            }
        } catch (error) {
            console.error('Error retrieving child:', error);
            res.status(500).json({ message: 'Error retrieving child', error: error.message });
        }
    }

    async create(req, res) {
        try {
            const childData = req.body;
            console.log('Received child data:', childData);
            
            // Validate required fields
            const requiredFields = ['name', 'age', 'gender', 'dob', 'parentName', 'parentNIC', 'parentEmail', 'parentContact', 'parentAddress'];
            const missingFields = requiredFields.filter(field => !childData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: 'Missing required fields', 
                    missingFields 
                });
            }

            // Validate age
            if (childData.age < 1 || childData.age > 18) {
                return res.status(400).json({ 
                    message: 'Age must be between 1 and 18' 
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(childData.parentEmail)) {
                return res.status(400).json({ 
                    message: 'Invalid email format' 
                });
            }

            const newChild = await childModel.create(childData);
            console.log('Created child:', newChild);
            
          res.status(201).json(newChild);

        } catch (error) {
            console.error('Error creating child:', error);
            
            // Handle specific database errors
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ 
                    message: 'A user with this NIC or email already exists' 
                });
            }
            
            if (error.code === '23503') { // Foreign key constraint violation
                return res.status(400).json({ 
                    message: 'Invalid group_id or parent_id reference' 
                });
            }
            
            res.status(500).json({ 
                message: 'Error creating child', 
                error: error.message 
            });
        }
    }

    async update(req, res) {
        const { id } = req.params;
        const childData = req.body;
        
        try {
            console.log('Updating child with ID:', id, 'Data:', childData);
            
            // Validate required fields
            const requiredFields = ['name', 'age', 'gender', 'dob'];
            const missingFields = requiredFields.filter(field => !childData[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({ 
                    message: 'Missing required fields', 
                    missingFields 
                });
            }

            // Validate age
            if (childData.age < 1 || childData.age > 18) {
                return res.status(400).json({ 
                    message: 'Age must be between 1 and 18' 
                });
            }

            // Check if child exists first
            const existingChild = await childModel.findById(id);
            if (!existingChild) {
                return res.status(404).json({ message: 'Child not found' });
            }

            const updatedChild = await childModel.update(id, childData);
            console.log('Updated child:', updatedChild);
            
            res.status(200).json(updatedChild);
        } catch (error) {
            console.error('Error updating child:', error);
            
            // Handle specific database errors
            if (error.code === '23503') { // Foreign key constraint violation
                return res.status(400).json({ 
                    message: 'Invalid group_id reference' 
                });
            }
            
            res.status(500).json({ 
                message: 'Error updating child', 
                error: error.message 
            });
        }
    }

    async delete(req, res) {
        const { id } = req.params;
        
        try {
            console.log('Deleting child with ID:', id);
            
            // Check if child exists first
            const existingChild = await childModel.findById(id);
            if (!existingChild) {
                return res.status(404).json({ message: 'Child not found' });
            }

            const deleted = await childModel.remove(id);
            console.log('Delete result:', deleted);
            
            if (deleted) {
                res.status(204).send(); // No content
            } else {
                res.status(404).json({ message: 'Child not found' });
            }
        } catch (error) {
            console.error('Error deleting child:', error);
            
            // Handle foreign key constraint errors
            if (error.code === '23503') {
                return res.status(409).json({ 
                    message: 'Cannot delete child. Child has associated records.' 
                });
            }
            
            res.status(500).json({ 
                message: 'Error deleting child', 
                error: error.message 
            });
        }
    }

}

export default new ChildController();