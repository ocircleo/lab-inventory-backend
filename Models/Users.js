const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email_address: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    terms: { type: Boolean, default: false },
    phone: { type: String },
    labs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Labs" }],
    address: { type: String },
    role: { type: String, default: "user", enum: ["admin", "staff", "user"] },
    disabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
const Users = mongoose.model("Users", UserSchema);
module.exports = Users;
