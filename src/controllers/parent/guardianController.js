// controllers/guardianController.js (or wherever it lives)
import { insertGuardian, getGuardiansByParent,deleteGuardianById } from '../../models/parent/guardianModel.js';

export const createGuardian = async (req, res) => {
  try {
    const { name, nic, relationship, phone, email, address, parent_id, image } = req.body || {};

    // Required fields (image is optional)
    if (!name || !nic || !relationship || !phone || !email || !address || !parent_id || !image) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Pass image through (may be undefined/null)
    const guardian = await insertGuardian({ name, nic, relationship, phone, email, address, parent_id, image });

    return res.status(201).json({ success: true, data: guardian });
  } catch (error) {
    console.error('Error creating guardian:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getGuardiansForParent = async (req, res) => {
  try {
    const { parent_id } = req.params;

    if (!parent_id) {
      return res.status(400).json({ success: false, message: 'Parent ID is required.' });
    }

    const guardians = await getGuardiansByParent(parent_id);

    return res.status(200).json({
      success: true,
      guardians,
      count: guardians.length
    });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteGuardian = async (req, res) => {
  try {
    const { guardian_id } = req.params;

    if (!guardian_id) {
      return res.status(400).json({ success: false, message: 'Guardian ID is required.' });
    }

    await deleteGuardianById(guardian_id);

    return res.status(200).json({ 
      success: true, 
      message: 'Guardian deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting guardian:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};