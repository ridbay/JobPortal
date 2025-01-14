/* eslint-disable no-console */
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");

mongoose.connect(process.env.MongoDbURI || "mongodb://localhost:27017/JobPortal", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database is connected");
  })
  .catch((err) => {
    console.log("Can not connect to the database ", err.message);
  });
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

// setup server
const app = express();
const server = require("http").createServer(app);
const socketIo = require("socket.io")(server, { wsEngine: "ws" });
const creds = require("./config/mailConfig");
const route = require("./expressRoutes/routes");

// Set constiables
app.set("env", process.env.NODE_ENV || "production");
app.use(cors());

app.use(express.static(path.join(__dirname, "client", "build")));

app.use(express.static(path.join(__dirname, "client/src/images")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", route);

// Right before your app.listen(), add this:
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});
const port = 3001;
server.listen((process.env.PORT || port), () => {
  console.log("Server is running on Port: ", process.env.PORT || port);
});
let clients = [];
// Setup socket.io
socketIo.on("connection", (socket) => {
  const { username } = socket.handshake.query;

  console.log(`${username} connected`);
  clients.push({ [username]: socket });
  clients = [...new Set(clients)];

  socket.on("client:message", (data) => {
    console.log(data);
    console.log(`${data.username}: ${data.message}`);
    // message received from client, now broadcast it to desired user
    clients.map((item, index) => {
      if (JSON.stringify(Object.keys(item)).indexOf(data.to) !== -1) {
        clients[index][data.to].emit("server:message", data);
        return true;
      }
      return false;
    });
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", { username });
  });


  socket.on("disconnect", () => {
    clients.pop();
    console.log(`${username} disconnected`);
  });
});

// Setting up NodeMailer

const transport = {
  host: "smtp.gmail.com",
  auth: {
    user: creds.USER,
    pass: creds.PASS,
  },
};

const transporter = nodemailer.createTransport(transport);

transporter.verify((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take messages");
  }
});

exports.transporter = transporter;
