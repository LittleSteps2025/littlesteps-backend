import { insertGuardian,getGuardiansByParent } from '../../models/parent/guardianModel.js';

export const createGuardian = async (req, res) => {
  try {
    const { name, nic, relationship, phone, email, address, parent_id } = req.body || {};
    if (!name || !nic || !relationship || !phone || !email || !address || !parent_id) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    const guardian = await insertGuardian({ name, nic, relationship, phone, email, address, parent_id });
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
      guardians: guardians,
      count: guardians.length 
    });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};