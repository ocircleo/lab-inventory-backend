const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    id: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, default: "" },
    category: { type: String, required: true, default: "component" },
    currentState: {
      type: String,
      enum: ["working", "broken", "under_maintenance"],
      default: "working",
    },
    dataType: {
      type: String,
      required: true,
      enum: ["text", "number", "description"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  },
  { timestamps: true }
);
const Components = mongoose.model("Components", componentSchema);
module.exports = Components;

