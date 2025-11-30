const mongoose = require("mongoose");
const TemplateSchema = new mongoose.Schema(
  {
    category: {type:String},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    dataModel: { type: Array, required: true },
  },
  { timestamps: true }
);
const Templates = mongoose.model("Templates", TemplateSchema);
module.exports = Templates;
