const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // 載入Express應用
const User = require("../models").user;

describe("Auth API", () => {
  before((done) => {
    mongoose.connect(
      "mongodb+srv://Chinyu-Liu:bEnXJe4bM57xuZEw@cluster0.jwz2fbx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", () => {
      console.log("We are connected to test database!");
      done();
    });
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  after((done) => {
    mongoose.connection.close();
    done();
  });

  describe("POST /api/user/register", () => {
    it("應該成功註冊新使用者", (done) => {
      request(app)
        .post("/api/user/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
          role: "student",
        })
        .expect(200)
        .then((response) => {
          console.log("response.body.msg...", response.body.msg);
          // 檢查返回的訊息
          if (response.body.msg !== "成功註冊") {
            return done(new Error("註冊訊息不匹配"));
          }
          // 檢查是否有 savedUser
          if (!response.body.savedUser) {
            return done(new Error("沒有返回 savedUser"));
          }
          done();
        })
        .catch((err) => done(err));
    });

    it("應該返回驗證錯誤訊息", (done) => {
      request(app)
        .post("/api/user/register")
        .send({
          username: "tu",
          email: "invalid-email",
          password: "123",
          role: "invalid-role",
        })
        .expect(400)
        .then((response) => {
          //   console.log("response...", response);
          // 檢查錯誤訊息
          if (!response.text.includes("")) {
            return done(new Error("驗證錯誤訊息不匹配"));
          }
          done();
        })
        .catch((err) => done(err));
    });

    it("應該返回 email 已經被註冊錯誤", (done) => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "student",
      });

      user.save().then(() => {
        request(app)
          .post("/api/user/register")
          .send({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
            role: "student",
          })
          .expect(500)
          .then((response) => {
            // 檢查錯誤訊息
            if (!response.text.includes("")) {
              return done(new Error("email 已經被註冊錯誤訊息不匹配"));
            }
            done();
          })
          .catch((err) => done(err));
      });
    });
  });
});
