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
const port = process.env.PORT || 8080; //部署後PORT會是動態變動的
// const path = require("path"); //跟路徑有關的套件

mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => {
    console.log("Connencting MongoDB...");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.use(express.static(path.join(__dirname, "client", "build")));

app.use("/api/user", authRoute);

app.use(
  //該route的request header必須有JWT才可進入
  "/api/courses", //只有登入系統(擁有JWT Token)的人，才能新增或註冊課程
  passport.authenticate("jwt", { session: false }), //會取用/config/passport.js裡面的JwtStrategy
  courseRoute
);

//3000是react預設的port
app.listen(port, () => {
  console.log("Server is listening port8080");
});
