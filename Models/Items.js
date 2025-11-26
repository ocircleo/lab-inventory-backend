const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, default: "computer" },
    componentList: { type: Array, default: [], ref: "components" },
    deviceList: { type: Array, default: [], ref: "items" },
    dataList: { type: Array, default: [] },
    currentState: {
      type: String,
      enum: ["working", "broken", "under_maintenance"],
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
