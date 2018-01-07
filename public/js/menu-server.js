function get(name){
  if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
    return decodeURIComponent(name[1]);
}

$(function () {
  
  var date = new Date(); 
  var proxy = "https://cors-anywhere.herokuapp.com/";

  $("#dining_location_input").change(function(){

    var diningLocation = $("#dining_location_input option:selected").val();
    var main_url = "https://phapps.compassappstore.com/WebtritionMenuWeb/MenuWorksData/GetJsonMealData?unitId=42141&apiKey=O4SvFVPCfrtFIPKWZiGH3qgsV3IHZJ9hcfqiop0&venue=" + diningLocation + "&year=" + date.getFullYear() + "&month=" + (date.getMonth()+1) + "&day=" + date.getDate();
    
    $.ajax({
      url: (proxy + main_url),
      dataType: "json",
      type: "GET",
      success: function(data){
        $("table").remove();
        $("#closed").remove();
        if(data.success == false){
          $("body").append("<p id='closed'>This dining location is currently closed.</p>");
        }
        else{
          $("body").append(createMenuTable(menu.currentUnit.Venue,false));
        } 
      }
    });
  });

  $("#menu-button").click(function(){
    
    //var diningLocation = get("diningLocation");
    var diningLocation = "SAC+Food+Court";
    var main_url = "https://phapps.compassappstore.com/WebtritionMenuWeb/MenuWorksData/GetJsonMealData?unitId=42141&apiKey=O4SvFVPCfrtFIPKWZiGH3qgsV3IHZJ9hcfqiop0&venue=" + diningLocation + "&year=" + date.getFullYear() + "&month=" + (date.getMonth()+1) + "&day=" + date.getDate();
    
    $.ajax({
      url: (proxy + main_url),
      dataType: "json",
      type: "GET",
      success: function(data){
        $("table").remove();
        $("#closed").remove();
        if(data.success == false){
          $("#menu-modal-body").append("<p id='closed'>This dining location is currently closed.</p>");
        }
        else{
          $("#menu-modal-body").append(createMenuTable(data.currentUnit.Venue,true));
        } 
      }
    });
  });

});


function createMenuTable(data,showCheckboxes) {
  var table = document.createElement("table");
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
        price.className = "price";
        if(items[k].SellPrice == "" || items[k].SellPrice == "null") {
          price.innerHTML = 'N/A';
        } else {
          price.innerHTML = items[k].SellPrice;
        }
        if(showCheckboxes){
          var checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = items[k].Name;
          checkbox.className = "checkbox";
          checkbox.addEventListener("change",function(){
            var checkboxes = document.getElementsByClassName("checkbox");
            var isChecked = this.checked;
            var i = 0;
            while(!isChecked && i < checkboxes.length){
              console.log(isChecked);
              isChecked = checkboxes[i].checked;
              i++;
            }
            if(isChecked){
              $("#send-selection").prop("disabled",false);
              console.log("ischecked..")
            }else{
              $("#send-selection").prop("disabled",true);
            }
          });
          row.append(checkbox);
        }
        row.append(name);
        row.append(price);
        table.append(row);
      }
    }
  }
  return table;
}
