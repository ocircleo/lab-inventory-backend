const express = require("express");
const { isUserStaff } = require("../utls/AuthFunctations");
const { sendSuccess, sendError } = require("../utls/ReturnFunctations");
const { printConsumedTime } = require("../utls/RequestTimeInfo");
const Logs = require("../Models/Logs");
const Items = require("../Models/Items");
const Users = require("../Models/Users");
const staff_router = express.Router();

/**
 * @route GET /staff/devices
 * @description Get assigned lab devices with pagination (Staff can only see devices from their assigned labs)
 * @access Private (Staff and Admin)
 * @query page: number, limit: number
 */
staff_router.get("/myLabs", isUserStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get current user with populated labs
    const user = await Users.findById(req.user._id).populate("labs");
    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    const labIds = user.labs.map((lab) => lab._id);

    // Get items in staff's assigned labs
    const items = await Items.find({ labId: { $in: labIds } })
      .populate("labId", "name type dept")
      .populate("createdBy", "name email_address")
      .skip(skip)
      .limit(limit);

    const total = await Items.countDocuments({ labId: { $in: labIds } });

    printConsumedTime(req, "Get Staff Devices ---");
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

/**
 * @route PUT /staff/devices/:deviceId/mark-status
 * @description Mark device as broken/repaired/replaced/transferred (Staff can update status for their assigned labs)
 * @access Private (Staff and Admin)
 */
staff_router.put(
  "/devices/:deviceId/update-mark-status",
  isUserStaff,
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

      // Get device
      const device = await Items.findById(deviceId).populate("labId");
      if (!device) {
        return sendError(res, 404, "Device not found.");
      }

      // Verify staff has access to this device's lab
      const user = await Users.findById(req.user._id).populate("labs");
      const staffLabIds = user.labs.map((lab) => lab._id.toString());
      const deviceLabId = device.labId._id.toString();

      if (!staffLabIds.includes(deviceLabId) && req.user.role !== "admin") {
        return sendError(
          res,
          403,
          "Access denied. You don't have permission to update this device."
        );
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
        type: "whole",
      });
      await log.save();

      printConsumedTime(req, "Mark Device Status ---");
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

module.exports = { staff_router };
