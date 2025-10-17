import { insertComplaint } from '../../models/parent/complaintModel.js';
import ChildModel from '../../models/teacher/childModel.js';

export const createComplaint = async (req, res) => {
    try {
        const { date, subject, recipient, description, child_id } = req.body || {};
        if (!date || !subject || !recipient || !description || !child_id) {
            return res.status(400).json({ success: false, message: 'date, subject, recipient, description and child_id are required' });
        }
        // validate recipient
        if (!['teacher', 'supervisor'].includes(recipient)) {
            return res.status(400).json({ success: false, message: 'recipient must be either "teacher" or "supervisor"' });
        }
        // validate child_id
        const child = await ChildModel.getChildById(Number(child_id));
        if (!child) {
            return res.status(404).json({ success: false, message: 'Child not found' });
        }
        const complaint = await insertComplaint({ child_id: Number(child_id), date, subject, recipient, description });
        return res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        console.error('Error creating complaint:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};