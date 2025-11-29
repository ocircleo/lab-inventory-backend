const express = require("express");
const { isUserStaff } = require("../utls/AuthFunctations");
const { sendSuccess, sendError } = require("../utls/ReturnFunctations");
const { printConsumedTime } = require("../utls/RequestTimeInfo");
const Logs = require("../Models/Logs");
const Items = require("../Models/Items");
const Users = require("../Models/Users");
const staff_router = express.Router();


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


module.exports = { staff_router };
