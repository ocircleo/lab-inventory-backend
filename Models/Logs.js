const mongoose = require("mongoose");

const LogsSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.ObjectId, ref: "Items" },
    type: { type: String, enum: ["whole","partial","component"] },
    operation: { type: String, enum:["broken","repaired","replaced","transferred","under_maintenance"]},
    message: String,
    userId: {type:mongoose.Schema.ObjectId,ref:"Users"}
  },
  { timestamps: true }
);

const Logs = mongoose.model("Logs", LogsSchema);
module.exports = Logs;
