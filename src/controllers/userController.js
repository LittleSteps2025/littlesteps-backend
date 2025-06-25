import { 
    createUserService, 
    deleteUserService, 
    getAllUsersService, 
    getUserByIdService, 
    updateUserService,
    syncFirebaseUserService,
    getUserByFirebaseUIDService 
} from "../models/userModel.js";

// Standardized response function 
const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status,
        message,
        data
    });
}

export const createUser = async (req, res, next) => {
    const { name, email, firebase_uid, profile_picture, phone } = req.body;
    try {
        const newUser = await createUserService({ 
            name, 
            email, 
            firebase_uid, 
            profile_picture, 
            phone 
        });
        handleResponse(res, 201, 'User created successfully', newUser);
    } catch (error) {
        next(error);
    }
}

export const getAllUsers = async (req, res, next) => {
    const { limit = 50, offset = 0 } = req.query;
    try {
        const users = await getAllUsersService({ limit: parseInt(limit), offset: parseInt(offset) });
        handleResponse(res, 200, 'Users fetched successfully', users);
    } catch (error) {
        next(error);
    }
}

export const getUserById = async (req, res, next) => {
    try {
        const user = await getUserByIdService(req.params.id);
        if (!user) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User fetched successfully', user);
    } catch (error) {
        next(error);
    }
}

export const getUserByFirebaseUID = async (req, res, next) => {
    try {
        const user = await getUserByFirebaseUIDService(req.params.firebaseUID);
        if (!user) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User fetched successfully', user);
    } catch (error) {
        next(error);
    }
}

export const updateUser = async (req, res, next) => {
    const { name, email, phone, profile_picture } = req.body;
    try {
        const updatedUser = await updateUserService(req.params.id, { 
            name, 
            email, 
            phone, 
            profile_picture 
        });
        if (!updatedUser) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User updated successfully', updatedUser);
    } catch (error) {
        next(error);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const deletedUser = await deleteUserService(req.params.id);
        if (!deletedUser) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User deleted successfully', deletedUser);
    } catch (error) {
        next(error);
    }
}

// Firebase-specific controller functions
export const syncFirebaseUser = async (req, res, next) => {
    const firebaseUser = req.body; // Firebase user object from client
    try {
        const syncedUser = await syncFirebaseUserService(firebaseUser);
        handleResponse(res, 200, 'User synced successfully', syncedUser);
    } catch (error) {
        next(error);
    }
}

export const deactivateUser = async (req, res, next) => {
    const { firebaseUID } = req.params;
    try {
        const deactivatedUser = await deleteUserService(firebaseUID); // Using soft delete
        if (!deactivatedUser) {
            return handleResponse(res, 404, 'User not found');
        }
        handleResponse(res, 200, 'User deactivated successfully', deactivatedUser);
    } catch (error) {
        next(error);
    }
}