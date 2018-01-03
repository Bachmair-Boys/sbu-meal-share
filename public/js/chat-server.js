"use strict"

const userRole = get("userRole");
const roomID = get("roomID");
const userName = get("name");

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

  var typing = false;
  var timeout = undefined;

  if (userRole === "orderer") {
    $('#waiting').html("Please wait for a deliverer to take your order.");
    $("#send").prop('disabled', true);

    socket.on('deliverer_name', function(name) {
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
      $("#waiting").css("display", "none");
      $("#send").prop('disabled', false);
      $("#camera-button").show();

      socket.emit("orderer_name", { roomID: roomID, name: userName });
    });
  } else if (userRole === "deliverer") { 
    $("#waiting").css("display", "none");
    $("#send").prop('disabled', false);
    $("#camera-button").show();

    socket.on('orderer_name', function(name) {
      $("#chatting-with").html("You are chatting with " + name + ".");
      $("#chatting-with").css("visibility", "visible");
    });
  }

  socket.on('connect', function() {
    socket.emit('room', { "room": roomID, "userRole": userRole });
    // Announce to the orderer that the deliverer has joined
    if (userRole == "deliverer")
      socket.emit('deliverer_name', {
        name: userName,
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
    $("#camera-button").hide();
    $("#chatting-with").css("visibility", "hidden");
    $("#picture-modal").modal("hide");
    if (userRole === 'deliverer')
      $("#waiting").html("The orderer has left the chat.").css('display', 'block');
    else if (userRole === 'orderer')
      $("#waiting")
        .html('The deliverer has left the chat. Please wait for a deliverer to take your order.')
        .css('display', 'block');
  });

  socket.on("typing", function(data) {
    if (data.userRole !== userRole) {
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

  $("#message_text").keydown(function(event) {
    const keycode = event.keyCode || event.which;
    const onTimeout = () =>  {
      typing = false;
      socket.emit("stopped_typing", { 
        room: roomID, 
        userRole: userRole, 
        name: userName 
      });
    };

    // Emit "is typing" message for any key pressed besides enter key.
    if (keycode != 13) {
      if (typing === false) {
        typing = true;
        socket.emit("typing", { 
          room: roomID, 
          userRole: userRole, 
          name: userName 
        });
        timeout = setTimeout(onTimeout, 2000);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(onTimeout, 2000);
      }
    }
  });

  /* Photo functionality */
  $("#take-photo").click(() => {
    const video = $("#camera-stream")[0];
    const canvas = $("#camera-canvas")[0];
    if (video.srcObject) {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      $("#taken-photo").attr("src", canvas.toDataURL("img/webp"));
      $("#camera-stream").hide();
      $("#taken-photo").show();

      $("#take-photo").hide();
      $("#discard-photo").show()
      $("#send-photo").show()
    }
  });

  $("#discard-photo").click(() => {
    $("#discard-photo").hide();
    $("#send-photo").hide();
    $("#taken-photo").hide();
    $("#camera-stream").show();
    $("#take-photo").show();
  });

  $("#send-photo").click(() => {
    $("#picture-modal").modal("hide");
    $("#discard-photo").hide();
    $("#send-photo").hide();
    $("#taken-photo").hide();
    $("#camera-stream").show();
    $("#take-photo").show();

    const video = $("#camera-stream")[0];
    const cardDiv = $("<div></div>").addClass("card mb-3");
    const cardImage = $("#taken-photo").clone().addClass("card-img-top photo-message").show();

    cardDiv.append(cardImage);

    const messageHTML = cardDiv[0].outerHTML;
    cardDiv.addClass("bg-primary text-white");
    cardDiv.addClass("sent");
    $("#messages").append(cardDiv);

    socket.emit('chat_message', {
      roomID: roomID,
      message: messageHTML,
      from: userRole
    });
  });

  $("#camera-button").click(() => {
    const video = $("#camera-stream")[0];
    const canvas = $("#camera-canvas")[0];
    if (!video.srcObject)
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          $("#take-photo").show();
        };
      }).catch((e) => {
        alert("Unable to open camera");
      });
  });
});
