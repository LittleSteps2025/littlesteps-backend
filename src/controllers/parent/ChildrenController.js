import { getAllChildren } from '../../models/parent/childrenModel.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

export const childrenDetails = async (req, res) => {
    try {
        // Get the ID from URL parameters, not request body
        const parentId = req.params.id;

        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: 'Parent ID is required',
                error: 'MISSING_PARENT_ID'
            });
        }

        // Validate that parentId is a number
        if (isNaN(parentId)) {
            return res.status(400).json({
                success: false,
                message: 'Parent ID must be a valid number',
                error: 'INVALID_PARENT_ID'
            });
        }

        const children = await getAllChildren(parseInt(parentId));
        handleResponse(res, 200, 'Children fetched successfully', children);
    } catch (error) {
        console.error('Error fetching children:', error);
        handleResponse(res, 500, 'Error fetching children', error.message);
    }
};