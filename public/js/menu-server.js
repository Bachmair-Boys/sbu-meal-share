var date = new Date(); 
var proxy = "https://cors-anywhere.herokuapp.com/";

$(function () {
  $("#dining_location_input").change(function(){

    var input = $("#dining_location_input option:selected").val();
    console.log(input);
    var main_url = "https://phapps.compassappstore.com/WebtritionMenuWeb/MenuWorksData/GetJsonMealData?unitId=42141&apiKey=O4SvFVPCfrtFIPKWZiGH3qgsV3IHZJ9hcfqiop0&venue=" + $("#dining_location_input option:selected").val() + "&year=" + date.getFullYear() + "&month=" + (date.getMonth()+1) + "&day=" + date.getDate();
    $.ajax({
      url: (proxy + main_url),
      dataType: "json",
      type: "GET",
      success: function(data){
        // Clear existing data:
        $("table").remove();
        $("#closed").remove();
        if(data.success == false){
          $("body").append("<p id='closed'>This dining location is currently closed.</p>")
        }
        else{
          createMenuTable(data.currentUnit.Venue);
        } 
      }
    });
  });
});

function createMenuTable(data) {
  var table = document.createElement("table");
  var head = document.createElement("thead");
  var menu_item = document.createElement("th");
  menu_item.innerHTML = "Menu Item";
  var item_price = document.createElement("th");
  item_price.innerHTML = "Price";
  head.append(item_price);
  head.append(menu_item);
  table.append(head);
  var periods = data.Periods;
  for(i=0; i < periods.length; i++) {
    var stations = periods[i].Stations;
    for(j=0; j < stations.length; j++) {
      var items = stations[j].MenuItems;
      for(k=0; k < items.length; k++) {
        var row = document.createElement("tr");
        var name = document.createElement("td");
        name.innerHTML = items[k].Name;
        var price = document.createElement("td");
        if(items[k].SellPrice == "" || items[k].SellPrice == "null") {
          price.innerHTML = 'N/A';
        } else {
          price.innerHTML = items[k].SellPrice;
        }
        row.append(name);
        row.append(price);
        table.append(row);
      }
    }
  }
  document.body.append(table);
}
