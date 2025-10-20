import {
  getMedicalRecordsByChild,
  getChildMedicalInfo,
  getRecordByChildAndDate,
  insertMedicalRecord,
  updateMedicalRecordByChildAndDate,
  updateChildMedicalInfo,
} from "../../models/parent/healthRecordModel.js";
import { getAllChildren } from "../../models/parent/childrenModel.js";
import ChildModel from "../../models/child/childModel.js";
import pool from "../../config/db.js";

// Validation helper functions
const validateChildId = (childId) => {
  const errors = [];

  if (!childId) {
    errors.push("child_id is required");
  } else if (typeof childId !== "number" && typeof childId !== "string") {
    errors.push("child_id must be a number or string");
  } else {
    const numericId = Number(childId);
    if (isNaN(numericId)) {
      errors.push("child_id must be a valid number");
    } else if (numericId <= 0) {
      errors.push("child_id must be a positive number");
    } else if (!Number.isInteger(numericId)) {
      errors.push("child_id must be an integer");
    }
  }

  return errors;
};

const validateRecordDate = (recordDate) => {
  const errors = [];

  if (!recordDate) {
    errors.push("record_date is required");
    return errors;
  }

  if (typeof recordDate !== "string") {
    errors.push("record_date must be a string");
    return errors;
  }

  // Check if it's a valid date format (YYYY-MM-DD or ISO string)
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (!dateRegex.test(recordDate)) {
    errors.push("record_date must be in YYYY-MM-DD format or valid ISO string");
    return errors;
  }

  const date = new Date(recordDate);
  if (isNaN(date.getTime())) {
    errors.push("record_date must be a valid date");
  } else {
    // Check if date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (date > today) {
      errors.push("record_date cannot be in the future");
    }

    // Check if date is not too far in the past (e.g., more than 100 years)
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
    if (date < hundredYearsAgo) {
      errors.push("record_date cannot be more than 100 years ago");
    }
  }

  return errors;
};

const validateRecordType = (type) => {
  const errors = [];
  const validTypes = ["checkup", "vaccination", "illness", "medication"];

  if (!type) {
    errors.push("type is required");
  } else if (typeof type !== "string") {
    errors.push("type must be a string");
  } else if (type.trim().length === 0) {
    errors.push("type cannot be empty");
  } else if (type.length > 20) {
    errors.push("type cannot exceed 20 characters");
  } else if (!validTypes.includes(type.toLowerCase())) {
    errors.push(`type must be one of: ${validTypes.join(", ")}`);
  }

  return errors;
};

const validateTitle = (title) => {
  const errors = [];

  if (!title) {
    errors.push("title is required");
  } else if (typeof title !== "string") {
    errors.push("title must be a string");
  } else if (title.trim().length === 0) {
    errors.push("title cannot be empty");
  } else if (title.length > 100) {
    errors.push("title cannot exceed 100 characters");
  } else if (title.trim().length < 3) {
    errors.push("title must be at least 3 characters long");
  }

  return errors;
};

const validateDescription = (description) => {
  const errors = [];

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("description must be a string");
    } else if (description.length > 1000) {
      errors.push("description cannot exceed 1000 characters");
    }
  }

  return errors;
};

// Public endpoint (no token required) - fetch by childId param
export const getMedicalRecordsPublic = async (req, res) => {
  try {
    const raw = req.params.childId || req.query.child_id;

    // Validate childId
    const childIdErrors = validateChildId(raw);
    if (childIdErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: { child_id: childIdErrors },
      });
    }

    const childId = parseInt(raw, 10);

    const [records, medicalInfo, child] = await Promise.all([
      getMedicalRecordsByChild(childId),
      getChildMedicalInfo(childId),
      ChildModel.findById(childId),
    ]);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
        errors: { child_id: ["No child found with the provided ID"] },
      });
    }

    return res.json({ success: true, data: { child, medicalInfo, records } });
  } catch (err) {
    console.error("Error in getMedicalRecordsPublic controller", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: { server: [err.message] },
    });
  }
};

// Update child medical info (blood type, allergies, etc.)
export const updateChildMedicalData = async (req, res) => {
  try {
    const raw = req.params.childId || req.body.child_id;
    const errors = {};

    // Validate childId
    const childIdErrors = validateChildId(raw);
    if (childIdErrors.length > 0) {
      errors.child_id = childIdErrors;
    }

    const childId = parseInt(raw, 10);
    const { blood_type, allergies, medical_info } = req.body || {};

    // Validate medical data fields
    if (blood_type !== undefined && blood_type !== null) {
      if (typeof blood_type !== "string") {
        errors.blood_type = ["Blood type must be a string"];
      } else if (blood_type.length > 10) {
        errors.blood_type = ["Blood type cannot exceed 10 characters"];
      }
    }

    if (allergies !== undefined && allergies !== null) {
      if (typeof allergies !== "string") {
        errors.allergies = ["Allergies must be a string"];
      } else if (allergies.length > 500) {
        errors.allergies = ["Allergies cannot exceed 500 characters"];
      }
    }

    if (medical_info !== undefined && medical_info !== null) {
      if (typeof medical_info !== "string") {
        errors.medical_info = ["Medical info must be a string"];
      } else if (medical_info.length > 1000) {
        errors.medical_info = ["Medical info cannot exceed 1000 characters"];
      }
    }

    // if (Object.keys(errors).length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Validation failed",
    //     errors,
    //   });
    // }

    // Validate child exists
    const child = await ChildModel.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
        errors: { child_id: ["No child found with the provided ID"] },
      });
    }

    const updated = await updateChildMedicalInfo(childId, {
      blood_type: blood_type || null,
      allergies: allergies || null,
      medical_info: medical_info || null,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateChildMedicalData error", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: { server: [err.message] },
    });
  }
};

// Create medical record (public - no auth) - now does upsert
export const createMedicalRecord = async (req, res) => {
  try {
    const { child_id, record_date, type, title, description } = req.body || {};
    const errors = {};

    // Validate all fields
    const childIdErrors = validateChildId(child_id);
    if (childIdErrors.length > 0) errors.child_id = childIdErrors;

    const dateErrors = validateRecordDate(record_date);
    if (dateErrors.length > 0) errors.record_date = dateErrors;

    const typeErrors = validateRecordType(type);
    if (typeErrors.length > 0) errors.type = typeErrors;

    const titleErrors = validateTitle(title);
    if (titleErrors.length > 0) errors.title = titleErrors;

    const descriptionErrors = validateDescription(description);
    if (descriptionErrors.length > 0) errors.description = descriptionErrors;

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Validate child exists
    const child = await ChildModel.findById(Number(child_id));
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
        errors: { child_id: ["No child found with the provided ID"] },
      });
    }

    try {
      // Check if record exists
      const existingRecord = await getRecordByChildAndDate(
        Number(child_id),
        record_date
      );

      let result;
      if (existingRecord) {
        // Update existing record
        result = await updateMedicalRecordByChildAndDate({
          child_id: Number(child_id),
          record_date,
          type,
          title,
          description: description || "",
        });
      } else {
        // Insert new record
        result = await insertMedicalRecord({
          child_id: Number(child_id),
          record_date,
          type,
          title,
          description: description || "",
        });
      }

      return res.status(201).json({ success: true, data: result });
    } catch (insertError) {
      console.error("Insert/Update error:", insertError);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: { server: [insertError.message] },
      });
    }
  } catch (err) {
    console.error("createMedicalRecord error", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: { server: [err.message] },
    });
  }
};

// Update medical record (public - no auth) — identify by child_id + record_date
export const updateMedicalRecord = async (req, res) => {
  try {
    const { child_id, record_date, type, title, description } = req.body || {};
    const errors = {};

    // Validate required fields for update
    const childIdErrors = validateChildId(child_id);
    if (childIdErrors.length > 0) errors.child_id = childIdErrors;

    const dateErrors = validateRecordDate(record_date);
    if (dateErrors.length > 0) errors.record_date = dateErrors;

    // Validate optional fields if provided
    if (type !== undefined) {
      const typeErrors = validateRecordType(type);
      if (typeErrors.length > 0) errors.type = typeErrors;
    }

    if (title !== undefined) {
      const titleErrors = validateTitle(title);
      if (titleErrors.length > 0) errors.title = titleErrors;
    }

    const descriptionErrors = validateDescription(description);
    if (descriptionErrors.length > 0) errors.description = descriptionErrors;

    // if (Object.keys(errors).length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Validation failed",
    //     errors,
    //   });
    // }

    // Ensure record exists
    console.log("Updating record:", { child_id, record_date });
    const existing = await getRecordByChildAndDate(
      Number(child_id),
      record_date
    );
    console.log("Existing record found in DB:", existing);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
        errors: {
          record: [
            "No medical record found for the provided child ID and date",
          ],
        },
      });
    }

    const updated = await updateMedicalRecordByChildAndDate({
      child_id: Number(child_id),
      record_date,
      type: type ?? existing.type,
      title: title ?? existing.title,
      description: description ?? existing.description,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateMedicalRecord error", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errors: { server: [err.message] },
    });
  }
};
