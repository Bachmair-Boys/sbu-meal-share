"use strict"
var delivererJoined;
var ordererJoined;
function get(name){
  if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
    return decodeURIComponent(name[1]);
}

function userJoined(){
  const userRole = get("userRole");
  if (userRole === 'deliverer' || delivererJoined) {
    delivererJoined = true;
    $("#waiting").html('');
    $("#send").prop('disabled', false);
    $("ul").empty();
  } else {
    $('#waiting').html("Please wait for a deliverer to take your order.");
    $("#send").prop('disabled', true);
  }
}

function userLeft(){
  const userRole = get("userRole");
  $("#send").prop('disabled', true);
  if (userRole === 'deliverer')
    $("#waiting").html("The orderer has left the chat.");
  else if (userRole === 'orderer')
    $("#waiting").html('The deliverer has left the chat. Please wait for a deliverer to take your order.');
}

$(function () {
  const socket = io.connect();
  socket.userRole = get("userRole");

  $('form').submit(function(){
    var divClass = "card mb-3 w-100";
    if(socket.userRole === "deliverer")
      divClass += "  bg-primary text-white";
    else
      divClass += "  bg-light";

    socket.emit('chat message', {
      "roomID": get("roomID"),
      "msg": '<li class="'+socket.userRole+'"><div class="'+divClass+'"><div class="card-body"><p class="card-text">'+$('#m').val()+'</p></li>'
    });
    $('#m').val('');
    return false;
  });

  socket.on('connect', function(){
    socket.emit('room', { "room": get('roomID'), "userRole": get("userRole") });
    socket.emit('user_joined', {
      "name": get("name"),
      "userRole": get("userRole"),
      "roomID": get("roomID")
    });
    if(get('userRole') === "deliverer")
      $( "<style>#messages li.orderer { text-align: left} #messages li.deliverer { text-align: right}</style>" ).appendTo( "head" );
  });
  socket.on('user_joined', function(userRole){
    console.log('userJoined: ' + userRole);
    if(userRole === "deliverer"){
      delivererJoined = true;
    }
    userJoined();
  });
  socket.on('message', function(msg){

    $('#messages').append($(msg));
    window.scrollTo(0, document.body.scrollHeight);
  });

  socket.on('name', function(name){
    console.log(name + " " + get("name"));
    if(name != get("name")){
      $('<div class="alert alert-info" role="alert"> You are chatting with ' + name + ' </div>').insertAfter('#waiting');

    }
  });

  socket.on("user_disconnected", function(userRole){
    userLeft();
  });
});

