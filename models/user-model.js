const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: { type: String, required: true, minlength: 3, maxlength: 50 },
  email: { type: String, required: true, minlength: 6, maxlength: 50 },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor"], required: true },
  date: { type: Date, default: Date.now },
});

//instanct methods
userSchema.methods.isStudent = function () {
  return this.role == "student";
};

userSchema.methods.isInstructor = function () {
  return this.role == "instructor";
};

userSchema.methods.comparePassword = async function (password, cb) {
  try {
    let result = await bcrypt.compare(password, this.password); //password:user輸入的密碼，this.password表存在資料庫的密碼
    return cb(null, result);
  } catch (e) {
    return cb(e, result);
  }
};

//mongodb middleware
userSchema.pre("save", async function (next) {
  //next表移交middleware控制權
  if (this.isNew || this.isModified(password)) {
    //this.isnew屬性表新用戶；this.isModified(var)表修改資料
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next(); //將控制權移交給下個middleware
});

module.exports = mongoose.model("User", userSchema);
