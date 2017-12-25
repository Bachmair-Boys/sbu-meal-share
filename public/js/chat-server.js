"use strict"
const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHTML(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function get(name){
  if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
    return decodeURIComponent(name[1]);
}

var delivererJoined;
var ordererJoined;
const userRole = get("userRole");

function userJoined() {
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

function userLeft() {
  $("#send").prop('disabled', true);
  $("#chatting-with").css("visibility", "hidden");
  if (userRole === 'deliverer')
    $("#waiting").html("The orderer has left the chat.");
  else if (userRole === 'orderer')
    $("#waiting").html('The deliverer has left the chat. Please wait for a deliverer to take your order.');
}

$(function () {
  const socket = io.connect();
  socket.userRole = userRole;

  $('form').submit(function(){
    // Only do something if the message isn't empty
    if ($("#message_text").val() !== "") {
      const message = $("<li></li>");
      const cardDiv = $("<div></div>").addClass("card mb-3 w-100");

      const cardBody = $("<div></div>").addClass("card-body");
      const cardText = $("<p></p>").addClass("card-text").html(escapeHTML($("#message_text").val()));

      message.append(cardDiv.append(cardBody.append(cardText)));
      console.log(message[0].outerHTML);

      const messageHTML = message[0].outerHTML;
      cardDiv.addClass("bg-primary text-white");
      message.addClass("sent");
      $("#messages").append(message);
        
      socket.emit('chat message', {
        "roomID": get("roomID"),
        "message": messageHTML,
        "from": userRole
      });
      $('#message_text').val('');
    }
    return false;
  });

  socket.on('connect', function() {
    socket.emit('room', { "room": get('roomID'), "userRole": get("userRole") });
    socket.emit('user_joined', {
      "name": get("name"),
      "userRole": get("userRole"),
      "roomID": get("roomID")
    });
  });

  socket.on('user_joined', function(userRole) {
    console.log('userJoined: ' + userRole);
    if(userRole === "deliverer") {
      delivererJoined = true;
    }
    userJoined();
  });

  socket.on('message', function(data) {
    if (data.from !== userRole) {
      const message = $(data.message).addClass("received");
      message.filter(":first-child").addClass("bg-light");

      $('#messages').append(message);
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  socket.on('name', function(name) {
    if(name != get("name")){
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
    }
  });

  socket.on("user_disconnected", function(userRole) {
    userLeft();
  });
});

