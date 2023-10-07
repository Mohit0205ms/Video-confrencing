const express = require("express");

const app = express();

const server = require("http").Server(app);

const { v4: uuidv4 } = require("uuid");

const io = require("socket.io")(server);

// Peer
const { ExpressPeerServer } = require("peer");

const { SourceTextModule } = require("vm");
const { join } = require("path");

const peerServer = ExpressPeerServer(server, {

  debug: true,

});

const list = [];

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use("/peerjs", peerServer);

app.get("/", (req, res) => {

  res.render("First");

});

app.get("/:room", (req, res) => {

  res.render("room", { roomId: req.params.room });

});

app.get("/:room/:username", (req, res) => {

  res.render("room", { roomId: req.params.room, userName: req.params.username });

});

const map1=new Map(); // Use to store data like username and roomId
// for every roomId -> thier is array

io.on("connection", (socket) => {

  console.log("A user is connected");

  socket.on("join-room", (roomId, userId,username) => {

    console.log('A user is joined in room');

    socket.join(roomId);

    if(!map1.get(roomId)){

      map1.set(roomId,[]);

    }
    io.to(roomId).emit('appendUser', username); // calling to the appendUser on client side

    socket.to(roomId).emit("user-connected", userId); // connecting user to the room

    io.to(roomId).emit("addOldUsers",map1.get(roomId));// calling add old users

    map1.get(roomId).push(username);

    console.log(map1.get(roomId).length);

    socket.on("message", (text, userName) => { // when user want to send message

      io.to(roomId).emit('createMessage', { text: text, userName: userName });

    })

  });

  socket.on('disconnect', () => {

    console.log("A user is disconnected.");

  });

});

server.listen(process.env.PORT || 3030);
