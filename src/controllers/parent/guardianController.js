import {
  insertGuardian,
  getGuardiansByParent,
  getParentIdByUserIdModel,
} from "../../models/parent/guardianModel.js";

export const getParentIdByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    const parent = await getParentIdByUserIdModel(userId);

    if (!parent) {
      return res
        .status(404)
        .json({ success: false, message: "Parent not found." });
    }

    return res.status(200).json({
      success: true,
      parent_id: parent.parent_id,
      message: "Parent ID retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parent ID:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const createGuardian = async (req, res) => {
  try {
    const { name, nic, relationship, phone, email, address, parent_id } =
      req.body || {};
    if (
      !name ||
      !nic ||
      !relationship ||
      !phone ||
      !email ||
      !address ||
      !parent_id
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }
    const guardian = await insertGuardian({
      name,
      nic,
      relationship,
      phone,
      email,
      address,
      parent_id,
    });
    return res.status(201).json({ success: true, data: guardian });
  } catch (error) {
    console.error("Error creating guardian:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getGuardiansForParent = async (req, res) => {
  try {
    const { parent_id } = req.params;

    if (!parent_id) {
      return res
        .status(400)
        .json({ success: false, message: "Parent ID is required." });
    }

    const guardians = await getGuardiansByParent(parent_id);

    return res.status(200).json({
      success: true,
      guardians: guardians,
      count: guardians.length,
    });
  } catch (error) {
    console.error("Error fetching guardians:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
