
const Users = require("../Models/Users");
const { verifyToken } = require("./JWTFunctions");
const { sendError } = require("./ReturnFunctations");

const isUsersRegistered = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return sendError(res, 401, "Token required. Please login first.");
    }

    const mainToken = token.replace("Bearer ", "");
    const payload = verifyToken(mainToken);

    if (!payload) {
      return sendError(res, 401, "Invalid or expired token.");
    }

    const user = await Users.findById(payload.id);
    if (!user || user.disabled) {
      return sendError(res, 401, "User not found or disabled.");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 500, "Server error during authentication.");
  }
};

const isUserAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return sendError(res, 401, "Token required. Please login first.");
    }

    const mainToken = token.replace("Bearer ", "");
    const payload = verifyToken(mainToken);

    if (!payload) {
      return sendError(res, 401, "Invalid or expired token.");
    }

    const user = await Users.findById(payload.id);
    if (!user || user.disabled) {
      return sendError(res, 401, "User not found or disabled.");
    }

    if (user.role !== "admin") {
      return sendError(res, 403, "Access denied. Admin privileges required.");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 500, "Server error during authorization.");
  }
};

const isUserStaff = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return sendError(res, 401, "Token required. Please login first.");
    }

    const mainToken = token.replace("Bearer ", "");
    const payload = verifyToken(mainToken);

    if (!payload) {
      return sendError(res, 401, "Invalid or expired token.");
    }

    const user = await Users.findById(payload.id);
    if (!user || user.disabled) {
      return sendError(res, 401, "User not found or disabled.");
    }

    if (user.role !== "staff" && user.role !== "admin") {
      return sendError(res, 403, "Access denied. Staff or Admin privileges required.");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 500, "Server error during authorization.");
  }
};

module.exports = { isUsersRegistered, isUserAdmin, isUserStaff };
