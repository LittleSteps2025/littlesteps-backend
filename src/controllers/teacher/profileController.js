// controllers/userController.js
import ProfileModel from '../../models/teacher/profileModel.js';

// ✅ Get a user profile by user ID
export const getUserProfileById = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userProfile = await ProfileModel.getUserById(currentUser.userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    next(error);
  }
};






// controllers/teacher/profileController.js
export const updateUserProfile = async (req, res, next) => {
  console.log(req.user); // 🔍 check this

  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { phone, address, profileImage } = req.body;

    const updatedUser = await ProfileModel.updateUserProfile(currentUser.userId, {
      phone,
      address,
      profileImage,
    });

    if (!updatedUser) {
      // ✅ Handle empty update gracefully
      return res.status(400).json({ message: 'No user found or nothing updated' });
    }

    res.status(200).json(updatedUser); // ✅ Always returns JSON
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



