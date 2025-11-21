const mongoose = require("mongoose");

const mongooseConnect = async () => {
  try {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ocircleo.zgezjlp.mongodb.net/lab_inventory?retryWrites=true&w=majority`;
    await mongoose.connect(uri);
    console.log("mongoose connected successfully--");
  } catch (error) {
    console.log("---- mongoose connection failed, reason: \n", error);
  }
};
module.exports = { mongooseConnect };
