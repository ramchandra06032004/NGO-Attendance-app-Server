import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Branch } from "../../models/branch.js";
import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { Internship } from "../../models/internship.js";
import bcrypt from "bcrypt";

// Create Branch
export const createBranch = asyncHandler(async (req, res) => {
  const { ngo_id, branch_name, location, admin_name, admin_email, admin_phone, password } = req.body;

  // Validate inputs
  if (!ngo_id || !branch_name || !location || !admin_name || !admin_email || !password) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Ensure only Ngo Super Admin can create branch
  if (req.user.userType !== "ngo" || req.user._id.toString() !== ngo_id) {
    throw new ApiError(403, "Only Super Admin can create branches for this NGO");
  }

  // Check if Ngo exists and is hierarchical
  const ngo = await Ngo.findById(ngo_id);
  if (!ngo || !ngo.is_hierarchical) {
    throw new ApiError(400, "Invalid NGO or NGO is not hierarchical");
  }

  // Check if branch email already exists
  const existingBranch = await Branch.findOne({ email: admin_email });
  if (existingBranch) {
    throw new ApiError(409, "Branch admin email already in use");
  }

  // Create new branch
  const newBranch = await Branch.create({
    ngoId: ngo_id,
    name: branch_name,
    location,
    adminName: admin_name,
    email: admin_email,
    adminPhone: admin_phone,
    password, // Pre-save hook hashes it
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        branch_id: newBranch._id,
      },
      "Branch created successfully"
    )
  );
});

// Get All Branches
export const getAllBranches = asyncHandler(async (req, res) => {
  const { ngo_id } = req.query;

  if (!ngo_id) {
    throw new ApiError(400, "ngo_id is required");
  }

  // Ensure only Super Admin can view all branches
  if (req.user.userType !== "ngo" || req.user._id.toString() !== ngo_id) {
    throw new ApiError(403, "Only Super Admin can view branches");
  }

  const branches = await Branch.find({ ngoId: ngo_id, isActive: true }).select("-password -tokens");

  // Format response and get stats
  const branchData = await Promise.all(
    branches.map(async (branch) => {
      // Calculate total events
      const eventsCount = await Event.countDocuments({ branchId: branch._id });
      const internshipsCount = await Internship.countDocuments({ branchId: branch._id });

      // Count unique students registered across all branch events
      const branchEvents = await Event.find({ branchId: branch._id }).select("colleges");
      const uniqueStudentIds = new Set();
      branchEvents.forEach((ev) => {
        ev.colleges.forEach((col) => {
          col.students.forEach((sId) => uniqueStudentIds.add(sId.toString()));
        });
      });
      const totalStudents = uniqueStudentIds.size;

      const lastActiveEvent = await Event.findOne({ branchId: branch._id }).sort({ createdAt: -1 });

      return {
        branch_id: branch._id,
        name: branch.name,
        location: branch.location,
        total_events: eventsCount,
        total_internships: internshipsCount,
        total_students: totalStudents,
        last_active: lastActiveEvent ? lastActiveEvent.createdAt.toISOString().split("T")[0] : branch.updatedAt.toISOString().split("T")[0],
      };
    })
  );

  return res.status(200).json(new ApiResponse(200, branchData, "Branches fetched successfully"));
});

// Get Branch Details
export const getBranchDetails = asyncHandler(async (req, res) => {
  const { branch_id } = req.params;

  const branch = await Branch.findById(branch_id).select("-password -tokens");
  if (!branch) {
    throw new ApiError(404, "Branch not found");
  }

  // Access control
  if (req.user.userType === "ngo" && req.user._id.toString() !== branch.ngoId.toString()) {
    throw new ApiError(403, "Not authorized to view this branch");
  } else if (req.user.userType === "branch_admin" && req.user._id.toString() !== branch_id) {
    throw new ApiError(403, "Not authorized to view other branches");
  }

  // Calculate total events
  const eventsCount = await Event.countDocuments({ branchId: branch._id });
  const internshipsCount = await Internship.countDocuments({ branchId: branch._id });

  // Count unique students registered across all branch events
  const branchEvents = await Event.find({ branchId: branch._id }).select("colleges");
  const uniqueStudentIds = new Set();
  branchEvents.forEach((ev) => {
    ev.colleges.forEach((col) => {
      col.students.forEach((sId) => uniqueStudentIds.add(sId.toString()));
    });
  });
  const totalStudents = uniqueStudentIds.size;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        branch_id: branch._id,
        name: branch.name,
        location: branch.location,
        admin: {
          name: branch.adminName,
          email: branch.email,
          phone: branch.adminPhone,
        },
        stats: {
          events: eventsCount,
          internships: internshipsCount,
          students: totalStudents,
        },
      },
      "Branch details fetched successfully"
    )
  );
});

// Update Branch
export const updateBranch = asyncHandler(async (req, res) => {
  const { branch_id } = req.params;
  const { name, location, adminName, adminPhone } = req.body;

  const branch = await Branch.findById(branch_id);
  if (!branch) {
    throw new ApiError(404, "Branch not found");
  }

  // Only NGO Super Admin can update
  if (req.user.userType !== "ngo" || req.user._id.toString() !== branch.ngoId.toString()) {
    throw new ApiError(403, "Only Super Admin can update branch details");
  }

  branch.name = name || branch.name;
  branch.location = location || branch.location;
  branch.adminName = adminName || branch.adminName;
  branch.adminPhone = adminPhone || branch.adminPhone;

  await branch.save();

  return res.status(200).json(new ApiResponse(200, branch, "Branch updated successfully"));
});

// Deactivate Branch
export const deactivateBranch = asyncHandler(async (req, res) => {
  const { branch_id } = req.params;

  const branch = await Branch.findById(branch_id);
  if (!branch) {
    throw new ApiError(404, "Branch not found");
  }

  // Only NGO Super Admin can deactivate
  if (req.user.userType !== "ngo" || req.user._id.toString() !== branch.ngoId.toString()) {
    throw new ApiError(403, "Only Super Admin can deactivate a branch");
  }

  branch.isActive = false;
  await branch.save();

  return res.status(200).json(new ApiResponse(200, null, "Branch deactivated successfully"));
});

// Reset Branch Password
export const resetBranchPassword = asyncHandler(async (req, res) => {
  const { branch_id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  const branch = await Branch.findById(branch_id);
  if (!branch) {
    throw new ApiError(404, "Branch not found");
  }

  // Only NGO Super Admin can reset password
  if (req.user.userType !== "ngo" || req.user._id.toString() !== branch.ngoId.toString()) {
    throw new ApiError(403, "Only Super Admin can reset branch password");
  }

  branch.password = newPassword; // Pre-save hook hashes it
  await branch.save();

  return res.status(200).json(new ApiResponse(200, null, "Branch password reset successfully"));
});
