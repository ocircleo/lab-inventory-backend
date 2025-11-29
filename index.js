const express = require("express");
const server = express();
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT ?? 5000;
const cors = require("cors");
const { pathMiddleWare } = require("./utls/RequestTimeInfo");
const { mongooseConnect } = require("./utls/MongooseConnect");
const { auth_router } = require("./Auth");
const { common_router } = require("./API/common");
const { admin_router } = require("./API/admin");
const { staff_router } = require("./API/staff");
const cookieParser = require("cookie-parser");
const { ALLOWED_CORS_LIST } = require("./config");

//middleware
server.use(
  cors({
    origin: ALLOWED_CORS_LIST,
    credentials: true,
  })
);
server.use(express.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, "public")));
mongooseConnect();
server.get("/", (req, res) => {
  res.send({ message: "Welcome to lab inventory Backend API" });
});
server.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs.html"));
});
server.use("/auth", pathMiddleWare, auth_router);
server.use("/common", pathMiddleWare, common_router);
server.use("/admin", pathMiddleWare, admin_router);
server.use("/staff", pathMiddleWare, staff_router);
server.use("/*all", pathMiddleWare, (req, res) => {
  res.send({ error: true, message: "API Path not found", data: {} });
});
server.listen(PORT, () => {
  console.log("Server is running at \n http://localhost:" + PORT);
});

//Api end points/*
/**
 common -------------
  - login - 1 api
  - register - 1 api
  - view profile - 1 api
  - update profile - 1 api
  - change password - 1 api
  - mark device as broken/repaired/replaced/transferred - 1 api
  - view devices - paginated - 1 api (optional)

 admin -------------
  - crud lab - 4 api
  - crud devices - 4 api
  - view whole logs - paginated - 1 api
  - publish logs - 1 api
  - manage staffs - add/remove staffs - 2 api

  staff -------------
  - view assigned lab devices - paginated  - 1 api
  - update mark device as broken/repaired/replaced/transferred - 1 api

______________________________________________________________________________
Total Apis = 21

 */
