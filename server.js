const express = require("express");
const app = express();
var bodyParser = require("body-parser");
var path = require("path");
var crypto = require("crypto");
var http = require('http').Server(app);
var io = require('socket.io')(http);

var check_in_database = {};
var order_database = {};
var chatting_orders = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/html/index.html"));
});

app.get("/check-in", function(req, res) {
  res.sendFile(path.join(__dirname + "/html/check-in.html"));
});

app.get("/order", function(req, res) {
  res.sendFile(path.join(__dirname + "/html/order.html"));
});

app.post("/submit-check-in", function(req, res) {
//  console.log(req.body.name);
  console.log(req.body.dining_location);
  if (check_in_database[req.body.dining_location] == undefined)
    check_in_database[req.body.dining_location] = [];

  check_in_database[req.body.dining_location].push(req.body.name);
  res.redirect("/show-orders?dining_location=" + req.body.dining_location);
});

app.post("/submit-order", function(req, res) {
  console.log(req.body.name);
  console.log(req.body.dining_location);
  console.log(req.body.pickup_location);
  console.log(req.body.payment);
  if (order_database[req.body.dining_location] == undefined)
    order_database[req.body.dining_location] = [];

  order = {
    name: req.body.name,
    pickup_location: req.body.pickup_location,
    payment: req.body.payment,
    order_id: crypto.createHash('md5').update("" + Date.now()).digest("hex") + Math.floor(Math.random() * 1024)
  };
  order_database[req.body.dining_location].push(order);

  res.redirect("/chat-with-deliverer?roomID=" + order.order_id + "&userType=orderer");
});

app.get("/chat-with-deliverer", function(req, res) {
  res.sendFile(__dirname + "/html/chat-server.html");
});

app.get("/chat-with-orderer", function(req, res) {
  console.log(req.body.order_id);
  chatting_orders[req.query.roomID] = true;
  res.sendFile(__dirname + "/html/chat-server.html");
});

app.get("/show-orders", function(req, res) {
  res.sendFile(path.join(__dirname + "/html/show-orders.html"));
});

app.get("/ajax-get-orders", function(req, res) {
  res.setHeader("Content-Type", "application/json");

  orders = order_database[req.query.dining_location];
  if (orders)
    orders = orders.filter(order => !chatting_orders[order.order_id])

  res.send(JSON.stringify(orders));
  res.end();
});

app.get("/ajax-get-check-ins", function(req, res) {
  console.log(JSON.stringify(check_in_database));
  res.end();
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected: ' + this.room);
    io.sockets.in(this.room).emit('user_disconnected', "true");
  });
});

io.on('connection', function(socket){
  socket.on('chat message', function(data){
  	//var obj = JSON.parse(data); 
  	var obj=data;
  	console.log("RoomID: "+obj.roomID+"; Message: "+obj.msg);
    io.sockets.in(obj.roomID).emit('message', obj.msg);
  });

  socket.on('user_joined', function(data){
  	console.log('RoomID: '+data.roomID+"; Type: "+data.type);
  	io.sockets.in(data.roomID).emit('user_joined', data.type);
  });

});

io.sockets.on('connection', function(socket) {
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('room', function(roomID) {
    	socket.room= roomID;
    	console.log(roomID);
        socket.join(roomID);
    });
});

http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:8080');
});


