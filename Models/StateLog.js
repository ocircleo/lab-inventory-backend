const mongoose = require("mongoose");

const LogsSchema = new mongoose.Schema(
  {
    itemId: String,
    itemType: String,
    operation: String,
    message: String,
    userId: { type: mongoose.Schema.ObjectId, ref: "Users" },
  },
  { timestamps: true }
);

const StateLogs = mongoose.model("StateLogs", LogsSchema);
module.exports = StateLogs;
