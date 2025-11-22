const express = require("express");
const { isUserAdmin } = require("../utls/AuthFunctations");
const Labs = require("../Models/Labs");
const Users = require("../Models/Users");
const { sendSuccess, sendError } = require("../utls/ReturnFunctations");
const Logs = require("../Models/Logs");
const { printConsumedTime } = require("../utls/RequestTimeInfo");
const Templates = require("../Models/Templates");

const admin_router = express.Router();

// ============ LAB MANAGEMENT ============

/**
 * @route POST /admin/add-template
 * @description Create a new Template
 * @access Private (Admin only)
 */
admin_router.post("/add-template", isUserAdmin, async (req, res) => {
  try {
    let { category, dataModel } = req.body.data;
    const id = req.user.id;
    console.log(id);
    if (!category) {
      return sendError(res, 400, "Template are required.");
    }
    category = category.toLowerCase();
    const templateValidate = await Templates.find({ category: category });
    if (templateValidate.length > 0)
      return res.send({
        success: false,
        message: "Category name already exists",
      });

    const newTemplate = new Templates({
      category,
      createdBy: id,
      dataModel,
    });

    const result = await newTemplate.save();
    return sendSuccess(res, 201, "Template created successfully.", result);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating lab.");
  }
});
/**
 * @route PUT /admin/update-template
 * @description update a  Template
 * @access Private (Admin only)
 */
admin_router.put("/update-template", isUserAdmin, async (req, res) => {
  try {
    let { id, data } = req.body;
    console.log({ id, data });
    const result = await Templates.findByIdAndUpdate(
      id,
      {
        dataModel: data,
      },
      { new: true }
    );
    if (!result) return sendError(res, 404, "Some Error Happened");
    return sendSuccess(res, 201, "Template Updated successfully.", result);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating lab.");
  }
});
/**
 * @route Delete /admin/delete-template
 * @description Create a new Template
 * @access Private (Admin only)
 */
admin_router.delete("/delete-template", isUserAdmin, async (req, res) => {
  try {
    let { id } = req.body;

    const result = await Templates.findByIdAndDelete(id);
    return sendSuccess(res, 201, "Template Deleted successfully.", result);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating lab.");
  }
});
/**
 * @route POST /admin/create-lab
 * @description Create a new lab
 * @access Private (Admin only)
 */
admin_router.post("/create-lab", isUserAdmin, async (req, res) => {
  try {
    const { name, type, dept } = req.body;
    if (!name || !type || !dept) {
      return sendError(
        res,
        400,
        "Lab name, type, and department are required."
      );
    }

    const newLab = new Labs({
      name,
      type,
      dept,
      admins: [req.user._id],
      staffs: [],
      items: [],
    });

    const result = await newLab.save();
    if (!result) return sendError(res, 403, "Lab created Failed.");
    return sendSuccess(res, 200, "Lab created Successful", result);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating lab.");
  }
});
/**
 * @route PUT /admin/update-lab
 * @description Update a  lab
 * @access Private (Admin only)
 */
admin_router.put("/update-lab", isUserAdmin, async (req, res) => {
  try {
    const { name, type, dept, id } = req.body;
    if (!name || !type || !dept) {
      return sendError(
        res,
        400,
        "Lab name, type, and department are required."
      );
    }
    const result = await Labs.findByIdAndUpdate(id, {
      name,
      type,
      dept,
    });
    if (!result) return sendError(res, 403, "Lab created Failed.");
    return sendSuccess(res, 200, "Lab created Successful", result);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating lab.");
  }
});

/**
 * @route GET /admin/labs
 * @description Get all labs
 * @access Private (Admin only)
 * @query page: number, limit: number
 */
admin_router.get("/labs", isUserAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const labs = await Labs.find()
      .populate("admins", "name email_address")
      .populate("staffs", "name email_address")
      .populate("items")
      .skip(skip)
      .limit(limit);

    const total = await Labs.countDocuments();

    printConsumedTime(req, "Get Labs ---");
    return sendSuccess(res, 200, "Labs retrieved successfully.", {
      labs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving labs.");
  }
});

/**
 * @route GET /admin/labs/:labId
 * @description Get specific lab details
 * @access Private (Admin only)
 */
admin_router.get("/labs/:labId", isUserAdmin, async (req, res) => {
  try {
    const { labId } = req.params;

    const lab = await Labs.findById(labId)
      .populate("admins", "name email_address")
      .populate("staffs", "name email_address")
      .populate("items");

    if (!lab) {
      return sendError(res, 404, "Lab not found.");
    }

    printConsumedTime(req, "Get Lab Details ---");
    return sendSuccess(res, 200, "Lab details retrieved successfully.", lab);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving lab.");
  }
});

/**
 * @route PUT /admin/labs/:labId
 * @description Update lab details
 * @access Private (Admin only)
 */
admin_router.put("/labs/:labId", isUserAdmin, async (req, res) => {
  try {
    const { labId } = req.params;
    const { name, type, dept } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (dept) updateData.dept = dept;

    const updatedLab = await Labs.findByIdAndUpdate(labId, updateData, {
      new: true,
    })
      .populate("admins", "name email_address")
      .populate("staffs", "name email_address")
      .populate("items");

    if (!updatedLab) {
      return sendError(res, 404, "Lab not found.");
    }

    printConsumedTime(req, "Update Lab ---");
    return sendSuccess(res, 200, "Lab updated successfully.", updatedLab);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while updating lab.");
  }
});

/**
 * @route DELETE /admin/labs/:labId
 * @description Delete a lab
 * @access Private (Admin only)
 */
admin_router.delete("/labs/:labId", isUserAdmin, async (req, res) => {
  try {
    const { labId } = req.params;

    const lab = await Labs.findByIdAndDelete(labId);
    if (!lab) {
      return sendError(res, 404, "Lab not found.");
    }

    // Remove lab from all users
    await Users.updateMany({ labs: labId }, { $pull: { labs: labId } });

    printConsumedTime(req, "Delete Lab ---");
    return sendSuccess(res, 200, "Lab deleted successfully.", {
      labId: lab._id,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while deleting lab.");
  }
});

// ============ DEVICE/ITEM MANAGEMENT ============

/**
 * @route POST /admin/devices
 * @description Create a new device/item
 * @access Private (Admin only)
 */
admin_router.post("/devices", isUserAdmin, async (req, res) => {
  try {
    const { name, category, labId, majorComponent, minorDescription } =
      req.body;

    if (!name || !category || !labId) {
      return sendError(
        res,
        400,
        "Device name, category, and lab are required."
      );
    }

    const Items = require("../Models/Items");
    const newItem = new Items({
      name,
      category,
      labId,
      majorComponent: majorComponent || {},
      minorDescription,
      createdBy: req.user._id,
      currentState: "working",
    });

    await newItem.save();

    // Add item to lab's items array
    await Labs.findByIdAndUpdate(labId, { $addToSet: { items: newItem._id } });

    printConsumedTime(req, "Create Device ---");
    return sendSuccess(res, 201, "Device created successfully.", {
      deviceId: newItem._id,
      name: newItem.name,
      category: newItem.category,
      status: newItem.currentState,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while creating device.");
  }
});

/**
 * @route GET /admin/devices
 * @description Get all devices/items
 * @access Private (Admin only)
 * @query page: number, limit: number
 */
admin_router.get("/devices", isUserAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const Items = require("../Models/Items");
    const items = await Items.find()
      .populate("labId", "name type dept")
      .populate("createdBy", "name email_address")
      .skip(skip)
      .limit(limit);

    const total = await Items.countDocuments();

    printConsumedTime(req, "Get Devices ---");
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
 * @route GET /admin/devices/:deviceId
 * @description Get specific device details
 * @access Private (Admin only)
 */
admin_router.get("/devices/:deviceId", isUserAdmin, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const Items = require("../Models/Items");
    const item = await Items.findById(deviceId)
      .populate("labId", "name type dept")
      .populate("createdBy", "name email_address");

    if (!item) {
      return sendError(res, 404, "Device not found.");
    }

    printConsumedTime(req, "Get Device Details ---");
    return sendSuccess(
      res,
      200,
      "Device details retrieved successfully.",
      item
    );
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving device.");
  }
});

/**
 * @route PUT /admin/devices/:deviceId
 * @description Update device details
 * @access Private (Admin only)
 */
admin_router.put("/devices/:deviceId", isUserAdmin, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, category, majorComponent, minorDescription } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (majorComponent) updateData.majorComponent = majorComponent;
    if (minorDescription) updateData.minorDescription = minorDescription;

    const Items = require("../Models/Items");
    const updatedItem = await Items.findByIdAndUpdate(deviceId, updateData, {
      new: true,
    })
      .populate("labId", "name type dept")
      .populate("createdBy", "name email_address");

    if (!updatedItem) {
      return sendError(res, 404, "Device not found.");
    }

    printConsumedTime(req, "Update Device ---");
    return sendSuccess(res, 200, "Device updated successfully.", updatedItem);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while updating device.");
  }
});

/**
 * @route DELETE /admin/devices/:deviceId
 * @description Delete a device/item
 * @access Private (Admin only)
 */
admin_router.delete("/devices/:deviceId", isUserAdmin, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const Items = require("../Models/Items");
    const item = await Items.findByIdAndDelete(deviceId);

    if (!item) {
      return sendError(res, 404, "Device not found.");
    }

    // Remove item from lab's items array
    if (item.labId) {
      await Labs.findByIdAndUpdate(item.labId, {
        $pull: { items: deviceId },
      });
    }

    printConsumedTime(req, "Delete Device ---");
    return sendSuccess(res, 200, "Device deleted successfully.", {
      deviceId: item._id,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while deleting device.");
  }
});

// ============ LOG MANAGEMENT ============

/**
 * @route GET /admin/logs
 * @description Get all logs with pagination
 * @access Private (Admin only)
 * @query page: number, limit: number
 */
admin_router.get("/logs", isUserAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const logs = await Logs.find()
      .populate("itemId", "name category currentState")
      .populate("userId", "name email_address role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Logs.countDocuments();

    printConsumedTime(req, "Get Logs ---");
    return sendSuccess(res, 200, "Logs retrieved successfully.", {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while retrieving logs.");
  }
});

/**
 * @route POST /admin/logs/publish
 * @description Publish logs (export/generate report)
 * @access Private (Admin only)
 */
admin_router.post("/logs/publish", isUserAdmin, async (req, res) => {
  try {
    const { format = "json" } = req.body;

    const logs = await Logs.find()
      .populate("itemId", "name category currentState")
      .populate("userId", "name email_address role")
      .sort({ createdAt: -1 });

    if (format === "csv") {
      // Generate CSV format
      let csvContent = "ID,Item,Operation,Type,Message,User,Date\n";
      logs.forEach((log) => {
        csvContent += `"${log._id}","${log.itemId?.name || "N/A"}","${
          log.operation
        }","${log.type}","${log.message || ""}","${
          log.userId?.name || "N/A"
        }","${log.createdAt}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=logs.csv");
      return res.send(csvContent);
    }

    printConsumedTime(req, "Publish Logs ---");
    return sendSuccess(res, 200, "Logs published successfully.", {
      totalRecords: logs.length,
      logs,
      publishedAt: new Date(),
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while publishing logs.");
  }
});

// ============ STAFF MANAGEMENT ============

/**
 * @route POST /admin/labs/:labId/staffs/:staffId
 * @description Add staff to a lab
 * @access Private (Admin only)
 */
admin_router.put("/makeStaff", isUserAdmin, async (req, res) => {
  try {
    const { staffId } = req.body;

    // Verify staff user exists and does not has staff or admin role
    const staffUser = await Users.findById(staffId);
    if (!staffUser) return sendError(res, 404, "No User Found");
    else if (staffUser.role == "staff" || staffUser.role == "admin") {
      return sendError(res, 401, "The user is already " + staffUser.role);
    }

    const result = await Users.findByIdAndUpdate(
      staffId,
      { role: "staff" },
      { new: true }
    );
    if (!result) return sendError(res, 404, "Some Error happened ");

    return sendSuccess(res, 201, "Staff added to lab successfully.", staffUser);
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while adding staff.");
  }
});
admin_router.put("/assignStaff", isUserAdmin, async (req, res) => {
  try {
    const { labId, staffId } = req.body;

    // Verify staff user exists and has staff role
    const staffUser = await Users.findById(staffId);
    console.log(staffUser?.role != "staff");
    console.log(staffUser);
    if (!staffUser) return sendError(res, 404, "No User Found");
    else if (staffUser?.role != "staff")
      return sendError(res, 403, "user-not-staff");

    // Add staff to lab
    const updatedLab = await Labs.findOneAndUpdate(
      { _id: labId, staffs: { $ne: staffId } },
      { $addToSet: { staffs: staffId } },
      { new: true }
    );
    if (!updatedLab) {
      return sendError(res, 404, "Failed to Add Staff");
    }
    if (updatedLab)
      // Add lab to staff's labs array
      await Users.findByIdAndUpdate(staffId, { $addToSet: { labs: labId } });

    return sendSuccess(res, 201, "Staff added to lab successfully.", {
      labId: updatedLab._id,
      staffAdded: staffUser.name,
      totalStaffs: updatedLab.staffs.length,
    });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while adding staff.");
  }
});
admin_router.put("/removeStaff", isUserAdmin, async (req, res) => {
  try {
    const { labId, staffId } = req.body;
    const updatedLab = await Labs.findOneAndUpdate(
      { _id: labId },
      { $pull: { staffs: staffId } },
      { new: true }
    );
    if (!updatedLab) {
      return sendError(res, 404, "Failed to Remove Staff");
    }
    if (updatedLab)
      // Add lab to staff's labs array
      await Users.findByIdAndUpdate(staffId, { $pull: { labs: labId } });

    return sendSuccess(res, 201, "Staff Removed from lab successfully.", {});
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error while removing staff.");
  }
});

/**
 * @route DELETE /admin/labs/:labId/staffs/:staffId
 * @description Remove staff from a lab
 * @access Private (Admin only)
 */
admin_router.delete(
  "/labs/:labId/staffs/:staffId",
  isUserAdmin,
  async (req, res) => {
    try {
      const { labId, staffId } = req.params;

      const updatedLab = await Labs.findByIdAndUpdate(
        labId,
        { $pull: { staffs: staffId } },
        { new: true }
      )
        .populate("admins", "name email_address")
        .populate("staffs", "name email_address")
        .populate("items");

      if (!updatedLab) {
        return sendError(res, 404, "Lab not found.");
      }

      // Remove lab from staff's labs array
      await Users.findByIdAndUpdate(staffId, { $pull: { labs: labId } });

      printConsumedTime(req, "Remove Staff from Lab ---");
      return sendSuccess(res, 200, "Staff removed from lab successfully.", {
        labId: updatedLab._id,
        staffRemoved: staffId,
        totalStaffs: updatedLab.staffs.length,
      });
    } catch (error) {
      console.log(error);
      return sendError(res, 500, "Server error while removing staff.");
    }
  }
);

module.exports = { admin_router };
