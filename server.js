const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

mongoose.connect("mongodb://docker:mongopw@localhost:55000").then(() => {
  console.log("Connected to db");
});

const UserSchema = mongoose.Schema({
  username: {
    type: String,
  },
});

const ExerciseSchema = mongoose.Schema({
  username: {
    type: String,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
  },
  date: {
    type: Date,
  },
});

let User = mongoose.model("User", UserSchema);
let Exercise = mongoose.model("Exercise", ExerciseSchema);

const app = express();
app.use(cors());

app.use(express.json());

app.post("/api/users", (req, res) => {
  const user = req.body.username;

  const u = new User({
    username: user,
  });

  u.save((err, user) => {
    if (err) return res.send({ error: err });
    res.send(user);
  });
});

app.get("/api/users", (req, res) => {
  const allusers = User.find((err, data) => {
    if (err) return res.send({ err: err });
    res.send(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const user = User.findById(req.params._id, (err, data) => {
    if (err) return res.send({ err: err });

    const d = req.body.date;

    const exercise = new Exercise({
      username: data.username,
      duration: req.body.duration,
      description: req.body.description,
      date: req.body.date === "" ? Date.now() : Date.parse(req.body.date),
    });

    exercise.save((err, data) => {
      if (err) return res.send({ err: err });
      
      res.send(data);
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let from = req.query["from"] === null ? "1970-01-01" : req.query["from"];
  let to = req.query["to"] === null ? "2970-01-01" : req.query["to"];
  let limit = req.query["limit"] === null ? 10000 : req.query["limit"];

  console.log([from, to, limit]);

  const t = User.findById(req.params._id, (err, user) => {
    if (err) return res.send({ err: err });
    Exercise.find({
      username: user.username,
      date: {
        $gte: from,
        $lte: to,
      },
    })
      .limit(limit)
      .exec((err, data) => {
        if (err) return res.send({ err: err });

        const ec = {
          username: user.username,
          count: data.length,
          _id: user._id,
          log: data.map((item) => {
            const dd = new Date(item.date);
            return {
              description: item.description,
              
              duration: item.duration,
              date: dd.toDateString(),
            };
          }),
        };
        res.send(ec);
      });
  });
});

app.listen(3001, () => {
  console.log("Listening ...");
});
