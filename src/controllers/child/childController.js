import bcrypt from "bcrypt";
import pool from "../../config/db.js";
import childModel from "../../models/child/childModel.js";
import { getParentByNic } from "../../models/supervisorModel.js";
import { getAllParents } from "../../models/parent/parentModel.js";
import { sendParentVerificationEmail } from "../../services/emailService.js";

// Helper function to generate 4-digit verification code
const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates 4-digit code
};

// Helper function to hash the verification code
const hashVerificationCode = async (code) => {
  const saltRounds = 12;
  return await bcrypt.hash(code, saltRounds);
};

// Helper function to update parent token in database
const updateParentToken = async (parentId, hashedToken) => {
  const query = `
    UPDATE parent 
    SET token = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE parent_id = $2 
    RETURNING parent_id;
  `;

  try {
    const result = await pool.query(query, [hashedToken, parentId]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating parent token:", error);
    throw error;
  }
};

class ChildController {
  async getAll(req, res) {
    try {
      const children = await childModel.findAll();
      res.status(200).json(children);
    } catch (error) {
      console.error("Error retrieving children:", error);
      res
        .status(500)
        .json({ message: "Error retrieving children", error: error.message });
    }
  }
  async checkVerifiedParent(req, res) {
    try {
      const { nic } = req.body;
      if (!nic) {
        return res.status(400).json({ message: "NIC is required" });
      }

      const parent = await childModel.checkParentByNIC(nic);
      if (parent) {
        return res.status(200).json({ verified: true, parent });
      } else {
        return res
          .status(404)
          .json({ verified: false, message: "Parent not found" });
      }
    } catch (error) {
      console.error("Error checking verified parent:", error);
      res.status(500).json({
        message: "Error checking verified parent",
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const child = await childModel.findById(id);
      if (child) {
        res.status(200).json(child);
      } else {
        res.status(404).json({ message: "Child not found" });
      }
    } catch (error) {
      console.error("Error retrieving child:", error);
      res
        .status(500)
        .json({ message: "Error retrieving child", error: error.message });
    }
  }

  async create(req, res) {
    try {
      const childData = req.body;
      const existParent = await getParentByNic(childData.parentNIC);
      console.log("Received child data:", childData);
      console.log("Parent found by NIC:", existParent);

      // Generate verification code at the start
      const verificationCode = generateVerificationCode();
      console.log("Generated verification code:", verificationCode);

      // Validate required fields
      const requiredFields = [
        "name",
        "age",
        "gender",
        "dob",
        "parentName",
        "parentNIC",
        "parentEmail",
        "parentContact",
        "parentAddress",
        "group_name",
        "package_name",
      ];
      const missingFields = requiredFields.filter((field) => !childData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Missing required fields",
          missingFields,
        });
      }

      // Validate age
      if (childData.age < 1 || childData.age > 15) {
        return res.status(400).json({
          message: "Age must be between 1 and 15",
        });
      }

      // Check if parent exists and handle accordingly
      if (existParent) {
        // Parent exists - add child under existing parent
        console.log(
          "Parent found, adding child under existing parent:",
          existParent
        );

        // Use existing parent data - override any provided parent details
        childData.parentName = existParent.name;
        childData.parentEmail = existParent.email;
        childData.parentContact = existParent.contact;
        childData.parentAddress = existParent.address;
        childData.parentNIC = existParent.nic;

        // Create child with existing parent reference
        const newChild = await childModel.createWithVerifiedParent(
          childData,
          existParent.parent_id
        );

        return res.status(201).json({
          message: "Child created successfully under existing parent",
          child: newChild,
          parent: existParent,
        });
      } else {
        // Parent doesn't exist - create new parent and child
        console.log("Parent not found, creating new parent and child");

        // Validate email format for new parent
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(childData.parentEmail)) {
          return res.status(400).json({
            message: "Invalid email format",
          });
        }

        // Generate 4-digit verification code
        const verificationCode = generateVerificationCode();
        console.log("Generated verification code:", verificationCode);

        // Hash the verification code
        const hashedToken = await hashVerificationCode(verificationCode);

        // Create new parent and child
        const newChild = await childModel.create(childData);
        console.log("Created child:", newChild);

        // Update parent token with hashed verification code
        await updateParentToken(newChild.parent_id, hashedToken);

        // Send verification code email to parent
        try {
          await sendParentVerificationEmail(
            childData.parentEmail,
            verificationCode,
            childData.parentName
          );
          console.log(
            "Verification email sent successfully to:",
            childData.parentEmail
          );
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
          // Don't fail the entire operation if email fails
          // Just log the error and continue
        }

        return res.status(201).json({
          message:
            "New parent and child created successfully. A 4-digit verification code has been sent to the parent's email.",
          child: newChild,
          emailSent: true,
        });
      }
    } catch (error) {
      console.error("Error creating child:", error);

      // Handle specific database errors
      if (error.code === "23505") {
        // Unique constraint violation - check which field is duplicated
        if (error.detail && error.detail.includes("email")) {
          return res.status(409).json({
            message: "This email address is already registered",
            field: "parentEmail",
            errorType: "duplicate_email",
          });
        }
      }

      if (error.code === "23503") {
        // Foreign key constraint violation
        return res.status(400).json({
          message: "Invalid group_id or parent_id reference",
          errorType: "foreign_key_violation",
        });
      }

      res.status(500).json({
        message: "Error creating child",
        error: error.message,
        errorType: "server_error",
      });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const childData = req.body;

    try {
      console.log("Updating child with ID:", id, "Data:", childData);

      // Validate required fields
      const requiredFields = [
        "name",
        "package_name",
        "parentContact",
        "parentAddress",
      ];
      const missingFields = requiredFields.filter((field) => !childData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Missing required fields",
          missingFields,
        });
      }

      // Validate age
      if (childData.age < 1 || childData.age > 15) {
        return res.status(400).json({
          message: "Age must be between 1 and 15",
        });
      }

      // Check if child exists first
      const existingChild = await childModel.findById(id);
      if (!existingChild) {
        return res.status(404).json({ message: "Child not found" });
      }

      const updatedChild = await childModel.update(id, childData);
      console.log("Updated child:", updatedChild);

      res.status(200).json(updatedChild);
    } catch (error) {
      console.error("Error updating child:", error);

      // Handle specific database errors
      if (error.code === "23503") {
        // Foreign key constraint violation
        return res.status(400).json({
          message: "Invalid group_id reference",
        });
      }

      res.status(500).json({
        message: "Error updating child",
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      console.log("Deleting child with ID:", id);

      // Check if child exists first
      const existingChild = await childModel.findById(id);
      if (!existingChild) {
        return res.status(404).json({ message: "Child not found" });
      }

      const deleted = await childModel.remove(id);
      console.log("Delete result:", deleted);

      if (deleted) {
        res.status(204).send(); // No content
      } else {
        res.status(404).json({ message: "Child not found" });
      }
    } catch (error) {
      console.error("Error deleting child:", error);

      // Handle foreign key constraint errors
      if (error.code === "23503") {
        return res.status(409).json({
          message: "Cannot delete child. Child has associated records.",
        });
      }

      res.status(500).json({
        message: "Error deleting child",
        error: error.message,
      });
    }
  }

  async getGroups(req, res) {
    try {
      const groups = await childModel.getGroups();
      res.status(200).json(groups);
    } catch (error) {
      console.error("Error retrieving groups:", error);
      const message =
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to retrieve groups. Please try again later.";
      res.status(500).json({ message });
    }
  }

  async getPackages(req, res) {
    try {
      const packages = await childModel.getPackages();
      res.status(200).json(packages);
    } catch (error) {
      console.error("Error retrieving packages:", error);
      const message =
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to retrieve packages. Please try again later.";
      res.status(500).json({ message });
    }
  }
  async getPackageById(req, res) {
    try {
      const { id: child_id } = req.params;
      console.log("Getting package for child ID:", child_id);

      const id = parseInt(child_id);

      // Validate id is a number
      if (!child_id || isNaN(id)) {
        return res.status(400).json({
          message: "Invalid child ID. Must be a number.",
          received: child_id,
        });
      }

      const packageData = await childModel.getPackageById(id);
      console.log("Package data retrieved:", packageData);

      if (packageData) {
        res.status(200).json({
          success: true,
          data: packageData,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Package not found for the given child ID",
          child_id: id,
        });
      }
    } catch (error) {
      console.error("Error retrieving package:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving package",
        error: error.message,
      });
    }
  }
  async check_nic(req, res) {
    try {
      const { nic } = req.body;

      // Validate input
      if (!nic || typeof nic !== "string" || nic.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "NIC is required and must be a valid string",
        });
      }

      const trimmedNic = nic.trim();

      // Basic NIC format validation (adjust based on your country's NIC format)
      if (trimmedNic.length < 9 || trimmedNic.length > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid NIC format",
        });
      }

      // Log the request for debugging
      console.log(
        `NIC check request: ${trimmedNic} at ${new Date().toISOString()}`
      );

      // Query to find parent by NIC from children table
      // Assuming you're using the same database connection as your other functions
      const query = `
      SELECT DISTINCT 
        u.name,
        u.email,
        u.address,
        u.phone,
        u.nic,
        p.parent_id,
        COUNT(c.child_id) as children_count
      FROM user u
      JOIN parent p ON u.user_id = p.user_id
      JOIN children c ON p.parent_id = c.parent_id
      WHERE u.nic = ? AND u.role = 'parent'
      GROUP BY u.nic, u.name, u.email, u.address, u.phone
      LIMIT 1
    `;

      // Execute the query (adjust based on your database setup)
      // If you're using MySQL with mysql2
      const [rows] = await db.execute(query, [trimmedNic]);

      // If you're using a different database or ORM, adjust accordingly:
      // const rows = await db.query(query, [trimmedNic]); // For some ORMs
      // const rows = await connection.query(query, [trimmedNic]); // For raw connections

      if (rows.length === 0) {
        // Log unsuccessful attempts (for security monitoring)
        console.log(`NIC not found: ${trimmedNic}`);

        return res.status(404).json({
          success: false,
          message: "Parent with this NIC does not exist in our records",
        });
      }

      const parentData = rows[0];

      // Log successful lookup
      console.log(
        `NIC found: ${trimmedNic} - ${parentData.children_count} children`
      );

      // Return parent details (matching your frontend expectations)
      const responseData = {
        parent_name: parentData.parent_name || "",
        parent_email: parentData.parent_email || "",
        parent_address: parentData.parent_address || "",
        parent_phone: parentData.parent_phone || "",
        nic: parentData.nic || "",
        children_count: parentData.children_count || 0,
      };

      return res.status(200).json({
        success: true,
        message: "Parent details found successfully",
        data: responseData,
        // Also include the fields with alternative names for frontend compatibility
        parent_name: responseData.parent_name,
        parent_email: responseData.parent_email,
        parent_address: responseData.parent_address,
        parent_phone: responseData.parent_phone,
      });
    } catch (error) {
      console.error("Error checking NIC:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error while checking NIC",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
  async get_all_parents(req, res) {
    try {
      const parents = await getAllParents();
      res.status(200).json(parents);
    } catch (error) {
      console.error("Error retrieving parents:", error);
      res.status(500).json({
        message: "Error retrieving parents",
        error: error.message,
      });
    }
  }
}

export default new ChildController();
