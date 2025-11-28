const express = require("express");
const { isUsersRegistered } = require("../utls/AuthFunctations");
const Users = require("../Models/Users");
const { sendSuccess, sendError } = require("../utls/ReturnFunctations");
const Logs = require("../Models/Logs");
const Labs = require("../Models/Labs");
const bcrypt = require("bcrypt");
const Items = require("../Models/Items");
const Delay = require("../utls/Delay");
const Templates = require("../Models/Templates");
const { default: mongoose } = require("mongoose");
const Components = require("../Models/Component");
const StateLogs = require("../Models/StateLog");
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

    if (dept && dept.startsWith("@all")) {
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
      .populate({
        path: "items",
        populate: {
          path: "deviceList componentList dataList",
        },
      })
      .populate("components")
      .populate({ path: "admins", select: "_id name email_address role" })
      .populate({ path: "staffs", select: "_id name email_address role" });
    return sendSuccess(res, 200, "Devices retrieved successfully.", fullLab);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving devices.");
  }
});
common_router.get("/staffLabs", isUsersRegistered, async (req, res) => {
  try {
    let user = req.user;
    console.log(user);
    const staffsLabs = await Users.findById(user._id).populate("labs");
    console.log(staffsLabs);
    let result = staffsLabs.labs || [];
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
common_router.get("/searchLabToInsert", isUsersRegistered, async (req, res) => {
  const name = req.query.lab || "";
  const role = req.user.role;
  try {
    let query = {
      name: { $regex: name, $options: "i" },
    };

    if (role === "staff") {
      query.staffs = req.user.id;
    }

    let result = await Labs.find(query).populate({
      path: "items",
      populate: {
        path: "deviceList",
      },
    });

    // If no result found
    if (result.length === 0 && name.startsWith("@all")) {
      if (role === "staff") {
        result = await Labs.find({ staffs: req.user.id }).populate({
          path: "items",
          populate: {
            path: "deviceList",
          },
        });
      } else {
        result = await Labs.find().populate({
          path: "items",
          populate: {
            path: "deviceList",
          },
        });
      }
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
common_router.get("/searchLab", isUsersRegistered, async (req, res) => {
  const name = req.query.lab || "";
  try {
    let result = await Labs.find({
      name: { $regex: name, $options: "i" },
    });
    if (result && result.length == 0)
      if (name.startsWith("@all")) result = await Labs.find();

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
common_router.get("/searchUserWithFilter", async (req, res) => {
  const email = req.query.user || "@all";
  const roleFilter = req.query.role || "@all";

  try {
    let result;

    if (roleFilter.startsWith("@all")) {
      if (email.startsWith("@all")) {
        result = await Users.find();
      } else {
        result = await Users.find({
          email_address: { $regex: email, $options: "i" },
        });
      }
    } else {
      if (email.startsWith("@all")) {
        result = await Users.find({ role: roleFilter });
      } else {
        result = await Users.find({
          email_address: { $regex: email, $options: "i" },
          role: roleFilter,
        });
      }
    }

    res.send({
      success: true,
      message: "Hare is the search Result",
      data: result || [],
    });
  } catch (error) {
    res.send({
      success: false,
      data: [],
      message: "Server error occurred",
    });
  }
});
common_router.get("/searchUser", async (req, res) => {
  const email = req.query.user || "";
  try {
    let result;
    if (email.startsWith("@")) {
      if (email.startsWith("@staff")) {
        let id = email.split("-")[1];
        if (id == "all") {
          const staffs = await Users.find({ role: "staff" });
          result = staffs;
        } else {
          let isValid = mongoose.Types.ObjectId.isValid(id);
          if (isValid) {
            let lab = await Labs.findById(id).populate(
              "staffs",
              "name email_address _id role labs"
            );
            result = lab?.staffs || [];
          }
        }
      } else if (email.startsWith("@admin")) {
        let id = email.split("-")[1];
        if (id == "all") {
          const admins = await Users.find({ role: "admin" });
          result = admins;
        } else {
          let isValid = mongoose.Types.ObjectId.isValid(id);
          if (isValid) {
            let admin = await Users.findById(id);
            if (admin) result = [admin];
            else result = [];
          }
        }
      } else result = [];
    } else {
      result = await Users.find({
        email_address: { $regex: email, $options: "i" },
      });
    }
    res.send({
      success: true,
      message: "Hare is the search Result",
      data: result || [],
    });
  } catch (error) {
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
      if (name.startsWith("@all")) result = await Templates.find();
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
common_router.put("/move-items", isUsersRegistered, async (req, res) => {
  try {
    const uId = req.user.id;

    const { moveFrom, moveTo, item } = req.body;
    let ids = Array.isArray(item.id) ? item.id : [item.id];

    if (moveFrom.id == moveTo.id) {
      return sendError(res, 400, "Cannot move items to the same location.");
    }
    if (item.id == moveTo.id) {
      return sendError(res, 400, "Cannot move items into themselves.");
    }
    const MODELS = {
      lab: Labs,
      item: Items, // if moveto.type can be "item"
    };

    const FIELD_MAP = {
      item: {
        lab: "items", // lab.items
        item: "deviceList", // device.deviceList
      },
      component: {
        lab: "components", // lab.components
        item: "componentList", // device.componentList
      },
    };

    // Resolve models
    const FromModel = MODELS[moveFrom.type];
    const ToModel = MODELS[moveTo.type];

    // Resolve fields to update
    const fromField = FIELD_MAP[item.type][moveFrom.type];
    const toField = FIELD_MAP[item.type][moveTo.type];

    // return sendSuccess(res, 200, "Items moved successfully [development].");
    if (!fromField || !toField) {
      return sendError(res, 400, "Invalid move operation.");
    }

    // 3. Execute updates
    const pullResult = await FromModel.findByIdAndUpdate(
      moveFrom.id,
      {
        $pull: { [fromField]: { $in: ids } },
      },
      { new: true }
    );

    const pushResult = await ToModel.findByIdAndUpdate(
      moveTo.id,
      {
        $push: { [toField]: { $each: ids } },
      },
      { new: true }
    );
    // 4. Final response
    sendSuccess(res, 200, "Items moved successfully.");
    // 5. Create move log
    moveLogs(req.body, uId);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while performing move operation.");
  }
});
common_router.get("/logs", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const logs = await Logs.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const totalItems = await Logs.find().countDocuments();
    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      data: logs,
      totalItems: totalItems,
    });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/logs/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const logs = await Logs.findById(id);

    return sendSuccess(res, 200, "Logs retrieved successfully.", logs);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/items/:itemId", async (req, res) => {
  try {
    const id = req.params.itemId;
    const result = await Items.findById(id).select(
      "name  value category currentState"
    );
    sendSuccess(res, 201, "found data", result);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/components/:componentId", async (req, res) => {
  try {
    const id = req.params.componentId;
    const result = await Components.findById(id).select(
      "name key  value category currentState"
    );
    sendSuccess(res, 201, "found data", result);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/singleLab/:labId", async (req, res) => {
  try {
    const id = req.params.labId;
    const result = await Labs.findById(id).select("name type dept");
    sendSuccess(res, 201, "found data", result);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/user/:userId", async (req, res) => {
  try {
    const id = req.params.userId;
    const result = await Users.findById(id).select("name role");
    sendSuccess(res, 201, "found data", result);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
/**
 * @route PUT /common/devices/:deviceId/mark-status
 * @description Mark device as broken/repaired/replaced/transferred
 * @access Private
 */
common_router.put("/updateStateLog", isUsersRegistered, async (req, res) => {
  try {
    const { status, itemId, itemType } = req.body;

    // Validate status
    const validStatuses = ["working", "broken", "under_maintenance"];

    if (!validStatuses.includes(status)) {
      status = validStatuses[0];
    }
    let device;
    if (itemType == "item")
      device = await Items.findByIdAndUpdate(itemId, {
        currentState: status,
      });
    else
      device = await Components.findByIdAndUpdate(itemId, {
        currentState: status,
      });
    if (!device) {
      return sendError(res, 404, "Device not found.");
    }
    sendSuccess(res, 200, "Device status updated successfully.", {});

    // Create log entry
    const log = new StateLogs({
      itemId: itemId,
      itemType: itemType,
      operation: status,
      message: `Device marked as ${status}`,
      userId: req.user._id,
    });
    await log.save();
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while updating device status.");
  }
});

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
common_router.get("/countUsers", async (req, res) => {
  try {
    const role = req.query.role;
    let result;
    if (role == "all") result = await Users.countDocuments();
    else result = await Users.countDocuments({ role: role });

    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      total: result,
    });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/countItems", async (req, res) => {
  try {
    const state = req.query.currentState;
    let result;
    if (state == "all") result = await Items.countDocuments();
    else result = await Items.countDocuments({ currentState: state });

    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      total: result,
    });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/countComponents", async (req, res) => {
  try {
    const state = req.query.currentState;
    let result;
    if (type == "all") result = await Components.countDocuments();
    else result = await Components.countDocuments({ currentState: state });

    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      total: result,
    });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});
common_router.get("/countLabs", async (req, res) => {
  try {
    let result = await Labs.countDocuments();

    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      total: result,
    });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Server error while retrieving logs.");
  }
});

module.exports = { common_router };

async function moveLogs(data, id) {
  try {
    const { moveTo, moveFrom, item } = data;
    const newLog = new Logs({
      moveTo: moveTo.type,
      moveToId: moveTo.id,
      moveFrom: moveFrom.type,
      moveFromId: moveFrom.id,
      itemType: item.type,
      itemId: item.id,
      userId: id,
    });
    const result = await newLog.save();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}
