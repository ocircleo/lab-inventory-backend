const mongoose = require("mongoose");
const TemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    componentList: { type: Array, default: [], ref: "components" },
    deviceList: { type: Array, default: [], ref: "items" },
    dataList: { type: Array, default: [] },
  },
  { timestamps: true }
);
const Templates = mongoose.model("Templates", TemplateSchema);
module.exports = Templates;
