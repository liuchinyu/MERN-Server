const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport); //將passport套件傳遞給config/passport.js
const cors = require("cors");

mongoose
  .connect("mongodb://localhost:27017/mernDB")
  .then(() => {
    console.log("Connencting MongoDB...");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/user", authRoute);

//該route的request header必須有JWT才可進入
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }), //會取用/config/passport.js裡面的JwtStrategy
  courseRoute
);

//只有登入系統(擁有JWT Token)的人，才能新增或註冊課程

//3000是react預設的port
app.listen(8080, () => {
  console.log("Server is listening port8080");
});
