const express = require("express");
const { isUsersRegistered } = require("../utls/AuthFunctations");
const { Users } = require("../Models/Users");
const { sendSuccess, sendError } = require("../utls/ReturnFunctations");
const Logs = require("../Models/Logs");
const Labs = require("../Models/Labs");
const bcrypt = require("bcrypt");
const Items = require("../Models/Items");
const Delay = require("../utls/Delay");
const Templates = require("../Models/Templates");
const common_router = express.Router();

// ============ PROFILE MANAGEMENT ============

/**
 * @route GET /common/profile
 * @description Get current user's profile
 * @access Private
 */
common_router.get("/profile", isUsersRegistered, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id).populate("labs");
    if (!user) {
      return sendError(res, 404, "User not found.");
    }
    return sendSuccess(res, 200, "Profile retrieved successfully.", {
      id: user._id,
      name: user.name,
      email_address: user.email_address,
      phone: user.phone,
      address: user.address,
      role: user.role,
      customId: user.customId,
      labs: user.labs,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving profile.");
  }
});

/**
 * @route PUT /common/profile
 * @description Update user's profile (name, phone, address)
 * @access Private
 */
common_router.put("/profile", isUsersRegistered, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await Users.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).populate("labs");

    if (!user) {
      return sendError(res, 404, "User not found.");
    }
    return sendSuccess(res, 200, "Profile updated successfully.", {
      id: user._id,
      name: user.name,
      email_address: user.email_address,
      phone: user.phone,
      address: user.address,
      role: user.role,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while updating profile.");
  }
});

/**
 * @route PUT /common/change-password
 * @description Change user's password
 * @access Private
 */
common_router.put("/change-password", isUsersRegistered, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(res, 400, "All password fields are required.");
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 400, "New passwords do not match.");
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters.");
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Current password is incorrect.");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return sendSuccess(res, 200, "Password changed successfully.");
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while changing password.");
  }
});

// ============ DEVICE MANAGEMENT ============

/**
 * @route GET /common/devices
 * @description Get paginated list of devices (user can see their assigned devices)
 * @access Private
 * @query page: number, limit: number
 */
common_router.get("/labs", isUsersRegistered, async (req, res) => {
  try {
    const dept = req.query?.dept; // dept may be -> null, undefined, "",
    const filters = [null, undefined, ""];
    if (filters.includes(dept)) dept = "all";

    if (dept == "all") {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const items = await Items.find().skip(skip).limit(limit);
      const total = await Items.countDocuments();
      return sendSuccess(res, 200, "Devices retrieved successfully.", {
        items,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    }
    const items = await Items.find({ dept: dept }).skip(skip).limit(limit);
    const total = await Items.countDocuments({ dept: dept });

    return sendSuccess(res, 200, "Devices retrieved successfully.", {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving devices.");
  }
});
common_router.get("/labs/:labId", isUsersRegistered, async (req, res) => {
  try {
    const labId = req.params.labId;
    const fullLab = await Labs.findById({ _id: labId })
      .populate("items")
      .populate({ path: "admins", select: "name email" })
      .populate({ path: "staffs", select: "name email" });
    return sendSuccess(res, 200, "Devices retrieved successfully.", fullLab);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving devices.");
  }
});
common_router.get("/searchLab", async (req, res) => {
  const name = req.query.lab || "";
  try {
    let result = await Labs.find({
      name: { $regex: name, $options: "i" },
    });
    if (result && result.length == 0) {
      if (name == "all") result = await Labs.find();
      console.log(result);
    }
    res.send({
      success: true,
      message: "Hare is the search Result",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      data: [],
      message: "Server error occurred",
    });
  }
});
common_router.get("/searchTemplate", async (req, res) => {
  const name = req.query.template || "";
  try {
    let result = await Templates.find({
      category: { $regex: name, $options: "i" },
    });
    if (result && result.length == 0) {
      if (name == "all") result = await Templates.find();
    }
    res.send({
      success: true,
      message: "Category name does not exists",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      data: [],
      message: "Server error occurred",
    });
  }
});
common_router.get("/template-by-id/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Templates.findById(id).populate({
      path: "createdBy",
      select: "name email_address",
    });
    if (result) return sendSuccess(res, 200, "Found data", result);
    sendError(res, 404, "No data found");
  } catch (error) {
    console.log(error);
    sendError(res, 500, "server error occurred");
  }
});
/**
 * @route PUT /common/devices/:deviceId/mark-status
 * @description Mark device as broken/repaired/replaced/transferred
 * @access Private
 */
common_router.put(
  "/devices/:deviceId/mark-status",
  isUsersRegistered,
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { status, type, message } = req.body;

      // Validate status
      const validStatuses = [
        "broken",
        "repaired",
        "replaced",
        "transferred",
        "under_maintenance",
      ];
      const validType = ["whole", "partial", "component"];
      if (!validStatuses.includes(status)) {
        status = validStatuses[0];
      }
      if (!validType.includes(type)) {
        type = validType[0];
      }

      const device = await Items.findById(deviceId);
      if (!device) {
        return sendError(res, 404, "Device not found.");
      }

      // Update device status
      device.currentState = status;
      await device.save();

      // Create log entry
      const log = new Logs({
        itemId: deviceId,
        operation: status,
        message: message || `Device marked as ${status}`,
        userId: req.user._id,
        type: type,
      });
      await log.save();

      return sendSuccess(res, 200, "Device status updated successfully.", {
        deviceId: device._id,
        status: device.currentState,
        logId: log._id,
      });
    } catch (error) {
      console.log(error);
      return sendError(res, 500, "Server error while updating device status.");
    }
  }
);

common_router.get("/delay", async (req, res) => {
  const delay = parseInt(req?.query?.delay || 1000);
  const type = req?.query?.type;
  const result = await Delay(delay);
  if (type == "error")
    return res.send({ success: false, message: "DElay api message" });
  else return res.send({ success: true, message: "DElay api success message" });
});
common_router.put("/delay", async (req, res) => {
  const delay = parseInt(req?.query?.delay || 1000);
  const type = req?.query?.type;
  const result = await Delay(delay);
  if (type == "error")
    return res.send({ success: false, message: "DElay api message" });
  else return res.send({ success: true, message: "DElay api success message" });
});
common_router.post("/delay", async (req, res) => {
  const delay = parseInt(req?.query?.delay || 1000);
  const type = req?.query?.type;
  const result = await Delay(delay);
  if (type == "error")
    return res.send({ success: false, message: "DElay api message" });
  else return res.send({ success: true, message: "DElay api success message" });
});
module.exports = { common_router };
