const mongoose = require("mongoose");

const TrashScheme = new mongoose.Schema(
  {
    name: { type: String, default: "Trash" },
    type: { type: String, default: "Trash Bin" },
    dept: { type: String, default: "all" },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Items" }],
    components: [{ type: mongoose.Schema.Types.ObjectId, ref: "Components" }],
  },
  { timestamps: true }
);

const Trashes = mongoose.model("Trashes", TrashScheme);
module.exports = Trashes;
