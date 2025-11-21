const mongoose = require("mongoose");

const LabSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    dept: { type: String, required: true },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    staffs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Items" }],
  },
  { timestamps: true }
);

const Labs = mongoose.model("Labs", LabSchema);
module.exports = Labs;
