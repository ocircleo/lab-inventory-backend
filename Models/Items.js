const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Templates" },
    majorComponents: { type: Array, default: [] },
    currentState: {
      type: String,
      enum: [
        "working",
        "broken",
        "under_maintenance",
        "repaired",
        " replaced",
        "transferred",
      ],
      default: "working",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: "Labs" },
  },
  { timestamps: true }
);
const Items = mongoose.model("Items", ItemSchema);
module.exports = Items;
//{name:string,category:templateId:majorComponents:[],labId:}