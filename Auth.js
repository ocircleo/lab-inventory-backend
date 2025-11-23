const express = require("express");
const { sendSuccess, sendError } = require("./utls/ReturnFunctations");
const { generateToken, verifyToken } = require("./utls/JWTFunctions");
const Token = require("./Models/Token");
const { prodMode, domain } = require("./modeCofig");
const auth_router = express.Router();
//!! Token must be reAssigned after certain period of time
auth_router.put("/login_with_token", async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: prodMode,
    sameSite: prodMode ? "none" : "lax",
    domain: domain,
  };

  const token = req.body.token;
  if (!token) {
    return sendError(res, 400, "Token required.");
  }
  const payload = verifyToken(token.replace("Bearer ", ""));
  if (!payload) {
    return res.clearCookie("access_token", cookieOptions).status(200).send({
      success: false,
      message: "Token verification failure",
      data: {},
    });
  }
  // Optionally check if token exists in DB (for logout/blacklist support)
  try {
    let mainToken = token.replace("Bearer ", "");
    const foundToken = await Token.findOne({ token: mainToken });
    if (!foundToken) {
      return res.clearCookie("access_token", cookieOptions).status(200).send({
        success: false,
        message: "Token is Expired",
        data: {},
      });
    }
    printConsumedTime(req, "Get Token ---");
    const user = await Users.findById(payload.id);
    if (!user) {
      return res.clearCookie("access_token", cookieOptions).status(200).send({
        success: false,
        message: "No User Found",
        data: {},
      });
    }

    printConsumedTime(req, "Get User ---");
    return sendSuccess(res, 200, "Token valid.", user);
  } catch (err) {
    return sendError(res, 500, "Server error while validating token.");
  }
});
auth_router.put("/login_with_cookie", async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: prodMode,
    sameSite: prodMode ? "none" : "lax",
    domain: domain,
  };

  const token = req.cookies.access_token;
  if (!token) {
    return sendError(res, 400, "Token required.");
  }
  const payload = verifyToken(token.replace("Bearer ", ""));
  if (!payload) {
    return res.clearCookie("access_token", cookieOptions).status(200).send({
      success: false,
      message: "Operation Failed",
      data: {},
    });
  }
  // Optionally check if token exists in DB (for logout/blacklist support)
  try {
    let mainToken = token.replace("Bearer ", "");
    const foundToken = await Token.findOne({ token: mainToken });
    if (!foundToken) {
      return res.clearCookie("access_token", cookieOptions).status(200).send({
        success: false,
        message: "Operation Failed",
        data: {},
      });
    }
    printConsumedTime(req, "Get Token ---");
    const user = await Users.findById(payload.id);
    if (!user) {
      return res.clearCookie("access_token", cookieOptions).status(200).send({
        success: false,
        message: "Operation Failed",
        data: {},
      });
    }

    printConsumedTime(req, "Get User ---");
    return sendSuccess(res, 200, "Token valid.", {
      name: user.name,
      email: user.email_address,
      role: user.role,
    });
  } catch (err) {
    return sendError(res, 500, "Server error while validating token.");
  }
});

auth_router.put("/login", async (req, res) => {
  try {
    const { email_address, password, remember } = req.body;

    // Basic validation
    if (!email_address || !password)
      return sendError(res, 400, "Email and password are required.");

    // Find user by email
    const user = await Users.findOne({ email_address });
    if (!user) return sendError(res, 401, "Invalid email or password.");

    // Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return sendError(res, 401, "Invalid email or password.");

    // Remove existing tokens for this user
    await Token.deleteMany({ user: user._id });
    // Auth successful
    const token = generateToken(
      { id: user._id, email: user.email_address },
      remember ? "7d" : "1h"
    );

    // Save token in DB
    let newToken = new Token({ user: user._id, token });
    await newToken.save();
    const cookieOptions = {
      httpOnly: true,
      secure: prodMode,
      sameSite: prodMode ? "none" : "lax",
      domain: domain,
    };

    if (remember)
      cookieOptions.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    else cookieOptions.expires = new Date(Date.now() + 12 * 60 * 60 * 1000);
    return res
      .cookie("access_token", "Bearer " + token, cookieOptions)
      .status(200)
      .send({
        success: true,
        message: "Operation Successful",
        data: {
          name: user.name,
          email_address: user.email_address,
          role: user.role,
        },
      });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error during login.");
  }
});
auth_router.post("/register", async (req, res) => {
  try {
    const { name, email_address, password, terms } = req.body;
    // Basic validation
    if (!name || !email_address || !password) {
      return sendError(res, 400, "All fields are required.");
    }

    // Check if user already exists
    const existingUser = await Users.findOne({ email_address });
    if (existingUser) {
      return sendError(res, 409, "Email address already registered.");
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password);
    const newUser = new Users({
      name,
      email_address,
      password: hashedPassword,
      terms,
      role: "user", // Default role
    });
    await newUser.save();

    // Remove existing tokens for this user (shouldn't exist, but for safety)
    await Token.deleteMany({ user: newUser._id });
    // Generate token for the new user
    const token = generateToken({
      id: newUser._id,
      email: newUser.email_address,
    });
    const newToken = new Token({ user: newUser._id, token });
    await newToken.save();

    const cookieOptions = {
      httpOnly: true,
      secure: prodMode,
      sameSite: prodMode ? "none" : "lax",
      domain: domain,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    return res
      .cookie("access_token", "Bearer " + token, cookieOptions)
      .status(200)
      .send({
        success: true,
        message: "Operation Successful",
        data: {
          name: newUser.name,
          email_address: newUser.email_address,
          role: newUser.role,
        },
      });
  } catch (error) {
    console.log(error);
    return sendError(res, 500, "Server error during registration.");
  }
});
// Need to remove toke from DB as well --task the the auth is completed =-=======-----------
//!!! potential bug one may logout others account if the have token
auth_router.delete("/logout", async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: prodMode,
      sameSite: prodMode ? "none" : "lax",
      domain: domain,
    };
    const token = req.cookies.access_token;
    if (!token) {
      return sendError(res, 400, "Token required.");
    }
    let mainToken = token.replace("Bearer ", "");
    await Token.deleteMany({ token: mainToken });
    res.clearCookie("access_token", cookieOptions).send({
      success: true,
      message: "Operation Successful",
      data: {},
    });
  } catch (error) {
    return sendError(res, 500, "Server error while Logging out.");
  }
});
module.exports = { auth_router };

// --- Password Utility Functions ---
const bcrypt = require("bcrypt");
const {
  pathMiddleWare,
  printTime,
  printConsumedTime,
} = require("./utls/RequestTimeInfo");
const Users = require("./Models/Users");

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
