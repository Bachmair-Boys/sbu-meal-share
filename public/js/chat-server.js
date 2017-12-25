"use strict"

const userRole = get("userRole");
const roomID = get("roomID");

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


$(function () {
  const socket = io.connect();
  socket.userRole = userRole;

  if (userRole === "orderer") {
    $('#waiting').html("Please wait for a deliverer to take your order.");
    $("#send").prop('disabled', true);

    socket.on('deliverer_name', function(name) {
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
      $("#waiting").html('');
      $("#send").prop('disabled', false);
      $("ul").empty();

      socket.emit("orderer_name", { roomID: roomID, name: get("name") });
    });
  } else if (userRole === "deliverer") { 
    $("#waiting").html('');
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
      $("#waiting").html("The orderer has left the chat.");
    else if (userRole === 'orderer')
      $("#waiting").html('The deliverer has left the chat. Please wait for a deliverer to take your order.');
  });
  
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
        
      socket.emit('chat_message', {
        roomID: roomID,
        message: messageHTML,
        from: userRole
      });
      $('#message_text').val('');
    }
    return false;
  });
});
