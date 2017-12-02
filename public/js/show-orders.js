function get(name){
   if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}

setInterval(function () {
  jQuery.ajax({ url: "/ajax-get-orders?dining_location=" + get("dining_location"), success: function(result) {
    orders_div = $("#orders_div");
    orders_div.empty();

    orders = result;
    for (var i = 0; i < orders.length; ++i) {
      var card_header = $("<div class='card-header'>" + orders[i].pickup_location + "</div>");
      var card_body = $("<div class='card-body'><p>Name: " + orders[i].name + "</p><p>Payment: " + 
        orders[i].payment + "</p></div>");
      var card = $("<div class='card'>");
      var button = $("<a class='btn btn-primary' href='/chat-with-orderer?roomID=" + orders[i].order_id + 
        "&userType=deliverer'>Chat</a>");
                  
      card_body.append(button);
      card.append(card_header);
      card.append(card_body);
      orders_div.append(card);
    }
  }});
}, 1000);
