function sendSuccess(
  res,
  statusCode = 200,
  message = "Operation Success",
  data = {}
) {
  return res.status(statusCode).json({ success: true, message, data });
}

function sendError(res, statusCode = 400, message = "Operation Failed") {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { sendSuccess, sendError };
