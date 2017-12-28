"use strict"

const userRole = get("userRole");
const roomID = get("roomID");
var typing = false;
var timeout = undefined;

function escapeHTML(string) {
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

  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

function get(name){
  if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
    return decodeURIComponent(name[1]);
}

function onTimeout(){
  typing = false;
  io.connect().emit("stopped_typing",{ "room": get('roomID'), "userRole": userRole, name: get("name") });
}


$(function () {
  const socket = io.connect();
  socket.userRole = userRole;

  if (userRole === "orderer") {
    $('#waiting').html("Please wait for a deliverer to take your order.");
    $("#send").prop('disabled', true);

    socket.on('deliverer_name', function(name) {
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
      $("#waiting").css("display", "none");
      $("#send").prop('disabled', false);
      $("ul").empty();

      socket.emit("orderer_name", { roomID: roomID, name: get("name") });
    });
  } else if (userRole === "deliverer") { 
    $("#waiting").css("display", "none");
    $("#send").prop('disabled', false);

    socket.on('orderer_name', function(name) {
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
    });
  }

  socket.on('connect', function() {
    socket.emit('room', { "room": get('roomID'), "userRole": userRole });
    // Announce to the orderer that the deliverer has joined
    if (userRole == "deliverer")
      socket.emit('deliverer_name', {
        name: get("name"),
        roomID: roomID
      });
  });

  socket.on('message', function(data) {
    if (data.from !== userRole) {
      const message = $(data.message).addClass("received");
      message.filter(":first-child").addClass("bg-light");

      $('#messages').append(message);
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  socket.on("user_disconnected", function() {
    $("#send").prop('disabled', true);
    $("#chatting-with").css("visibility", "hidden");
    if (userRole === 'deliverer')
      $("#waiting").html("The orderer has left the chat.").css('display', 'block');
    else if (userRole === 'orderer')
      $("#waiting")
        .html('The deliverer has left the chat. Please wait for a deliverer to take your order.')
        .css('display', 'block');
  });

  socket.on("typing", function(data){
    if(data.userRole !== userRole){
      $("#chatting-with").html(data.name  + " is typing...");
    }
  });

  socket.on("stopped_typing", function(data){
    if(data.userRole !== userRole){
      $("#chatting-with").html("You are chatting with " + data.name + ".");
    }
  });
  
  $('form').submit(function(){
    // Only do something if the message isn't empty
    if ($("#message_text").val() !== "") {
      const cardDiv = $("<div></div>").addClass("card mb-3");
      const cardBody = $("<div></div>").addClass("card-body");
      const cardText = $("<p></p>").addClass("card-text").html(escapeHTML($("#message_text").val()));

      cardDiv.append(cardBody.append(cardText));

      const messageHTML = cardDiv[0].outerHTML;
      cardDiv.addClass("bg-primary text-white");
      cardDiv.addClass("sent");
      $("#messages").append(cardDiv);
        
      socket.emit('chat_message', {
        roomID: roomID,
        message: messageHTML,
        from: userRole
      });
      $('#message_text').val('');
    }
    return false;
  });

  $("#message_text").keydown(function(event){
      var keycode = event.keyCode || event.which;
      // Emit "is typing" message for any key pressed besides enter key.
      if(keycode != 13){
          if(typing === false){
            typing = true;
            socket.emit("typing",{ "room": get('roomID'), "userRole": userRole, name: get("name") });
            timeout = setTimeout(onTimeout, 2000);
          }
          else{
            clearTimeout(timeout);
            timeout = setTimeout(onTimeout, 2000);
          }
      }
  });

});
