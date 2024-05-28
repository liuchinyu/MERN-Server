const { equal } = require("joi");

const route = require("express").Router();
const Course = require("../models/").course;
const User = require("../models").user;
const courseValidation = require("../validation").courseValidation;

route.use((req, res, next) => {
  console.log("course route正在接收");
  next();
});

//獲得所有課程
route.get("/", async (req, res) => {
  try {
    let courseFound = await Course.find().populate("instructor", [
      //取得mongodb的_id(instructor的資料)及其相關訊息
      "username",
      "email",
      // "password", //加密過的密碼也可讀取
    ]);
    res.send(courseFound);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

//用學生id尋找註冊過的課程
route.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let coursesFound = await Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

//用講師id尋找課程
route.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  let coursesFound = await Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .exec();
  res.send(coursesFound);
});

//用課程id尋找課程
route.get("/:_id", async (req, res) => {
  try {
    let { _id } = req.params;
    let courseFound = await Course.findOne({ _id })
      .populate("instructor", ["email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});
route.get("/findByName/:name", async (req, res) => {
  try {
    let { name } = req.params;
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["email", "username"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

//透過課程id查詢修課學生
route.get("/foundStudent/:_id", async (req, res) => {
  let { _id } = req.params;
  console.log("123");
  try {
    let foundCourse = await Course.findOne({ _id }).exec();
    let studentPromises = foundCourse.students.map(async (studentId) => {
      let foundStudent = await User.findOne({ _id: studentId });
      return foundStudent.username;
    });
    console.log(studentPromises);
    let students = await Promise.all(studentPromises); //透過Promise.all將有修課的學生都列出來後再return
    return res.send(students);
  } catch (e) {
    return res.status(500).send("查無此課程");
  }
});

//新增課程
route.post("/", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師才能發布課程。若你已是講師，請透過講師帳號登入");
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let savedCourse = await newCourse.save();
    return res.send({ message: "新課程已保存", savedCourse });
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

//透過課程id註冊課程
route.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id }).exec();
    console.log("cour", course);
    if (course.students.includes(req.user.id)) {
      return res.status(500).send("您已經註冊過此課程囉");
    }
    course.students.push(req.user._id); //因此route為登入過後才可連接的route，可透過先前設定的req.user
    await course.save();
    return res.send("註冊完成");
  } catch (e) {
    console.log(e.message);
  }
});

route.patch("/:_id", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到此課程，無法更新課程內容");
    }
    if (courseFound.instructor.equals(req.user._id)) {
      let updateCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      }).exec();
      return res.send({ message: "資料已更新成功", updateCourse });
    } else {
      return res.status(403).send("只有這堂課的講師可以更新資料");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

route.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到此課程，無法更新課程內容");
    }
    if (courseFound.instructor.equals(req.user._id)) {
      let deleteCourse = await Course.deleteOne({ _id }).exec();
      res.send("課程已被刪除");
    } else {
      return res.status(403).send("只有這堂課的講師可以刪除資料");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = route;
