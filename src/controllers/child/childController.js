import childModel from '../../models/child/childModel.js';

class ChildController {
    async getAll(req, res) {
        try {
            const children = await childModel.findAll();
            res.status(200).json(children);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving children', error });
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
            res.status(500).json({ message: 'Error retrieving child', error });
        }
    }

    async create(req, res) {
        const childData = req.body;
        try {
            const newChild = await childModel.create(childData);
            res.status(201).json(newChild);
        } catch (error) {
            res.status(500).json({ message: 'Error creating child', error });
        }
    }

    async update(req, res) {
        const { id } = req.params;
        const childData = req.body;
        try {
            const updatedChild = await childModel.update(id, childData);
            if (updatedChild) {
                res.status(200).json(updatedChild);
            } else {
                res.status(404).json({ message: 'Child not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating child', error });
        }
    }

    async delete(req, res) {
        const { id } = req.params;
        try {
            const deleted = await childModel.remove(id);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Child not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting child', error });
        }
    }
}

export default new ChildController();