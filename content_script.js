search_text = document.getElementById("lst-ib").value;

chrome.runtime.sendMessage({ method_name: "get_tab_status" }, function(response){
  if (response.tab_status == "disabled") {
    addEnableButton();
  } else {
    addDisableButton();
    plotMap();
  }
});


function addDisableButton() {
  var buttons_div = document.getElementById("gs_st0");
  var disable_icon = document.createElement('a');
  disable_icon.setAttribute('class', 'gsst_a');
  disable_span = document.createElement('span');
  disable_span.setAttribute('class', 'gsri_a_search_disable');
  disable_icon.appendChild(disable_span);
  buttons_div.insertBefore(disable_icon, buttons_div.firstChild);

  disable_icon.addEventListener('click', function(e){
    // prevent event propagation
    chrome.runtime.sendMessage({ method_name: "disable_search" }, function(response){
      disable_icon.parentNode.removeChild(disable_icon);
      addEnableButton();
      removeMap(); // delete map from search results
    });
  });
}

function addEnableButton() {
  var buttons_div = document.getElementById("gs_st0");
  var enable_icon = document.createElement('a');
  enable_icon.setAttribute('class', 'gsst_a');
  enable_span = document.createElement('span');
  enable_span.setAttribute('class', 'gsri_a_search_enable');
  enable_icon.appendChild(enable_span);
  buttons_div.insertBefore(enable_icon, buttons_div.firstChild);

  enable_icon.addEventListener('click', function(e){
    // prevent event propagation
    chrome.runtime.sendMessage({ method_name: "enable_search" }, function(response){
      enable_icon.parentNode.removeChild(enable_icon);
      addDisableButton();
      plotMap();
    });

  });
}

function plotMap() {
  console.log("Searching for : " + search_text);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
      customDiv = document.createElement("div");
      customDiv.setAttribute("id", "customDiv");

      results_div = document.getElementById("rso");
      results_div.insertBefore(customDiv, results_div.firstChild);

      chrome.runtime.sendMessage({ method_name: "get_shops", search_text: search_text, latitude: position.coords.latitude, longitude: position.coords.longitude }, function(response){
        console.log("inside content_script");
        console.log(response);
        if (response["shops_response"]["status_code"] == 200) {
          mapDiv = document.createElement('div');
          mapDiv.setAttribute("id", "injectedMap");
          mapDiv.setAttribute("style", "width:632px;height:328px;position:relative;padding:0;margin:0 0 25px -16px;");
          customDiv.appendChild(mapDiv);

          var shops = JSON.stringify(response["shops_response"]["results"]);
          console.log(shops);

          var actualCode = `
          function injectMap() {
            console.log('inside injectMap');

            console.log(${position.coords.latitude});
            console.log(${position.coords.longitude});

            var mapProp= {
              center: new google.maps.LatLng(${position.coords.latitude},${position.coords.longitude}),
              // center: new google.maps.LatLng(12.9697353,80.2440785),
              zoom: 15,
              panControl: false,
              zoomControl: true,
              mapTypeControl: true,
              scaleControl: false,
              streetViewControl: false,
              overviewMapControl: false,
              rotateControl: false
            };
            var map = new google.maps.Map(document.getElementById("injectedMap"),mapProp);

            var shop_locations = ${shops};
            var customDiv = document.getElementById("customDiv");
            listDiv = document.createElement("div");
            listDiv.setAttribute("class", "list-div");

            for (i in shop_locations) {
              var label = parseInt(i) + parseInt(1);
              var marker = new google.maps.Marker({ position: { lat: shop_locations[i]['latitude'], lng: shop_locations[i]['longitude'] }, label: label.toString() });
              marker.setMap(map);

              shopTag = document.createElement("p"); shopTag.setAttribute("class", "shop-tag");
              indexSpan = document.createElement("span"); indexSpan.setAttribute("class", "index-span"); indexSpan.innerHTML = label;
              shopTag.appendChild(indexSpan);

              nameSpan = document.createElement("span"); nameSpan.setAttribute("class", "name-span"); nameSpan.innerHTML = shop_locations[i]["name"];
              shopTag.appendChild(nameSpan);

              phoneSpan = document.createElement("span"); phoneSpan.setAttribute("class", "phone-span"); phoneSpan.innerHTML = shop_locations[i]["phone"];
              shopTag.appendChild(phoneSpan);

              listDiv.appendChild(shopTag);

              // listDiv.innerHTML = i + " : " + shop_locations[i]["name"] + " : " + shop_locations[i]["phone"]
            }

            // productLogo = document.createElement("div"); productLogo.setAttribute("class", "product-logo");
            // listDiv.appendChild(productLogo);

            customDiv.appendChild(listDiv);
          }
          `

          var inject_map_script = document.createElement('script');
          inject_map_script.textContent = actualCode;
          document.head.appendChild(inject_map_script);

          var map_script = document.createElement('script');
          map_script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBHDiiKYDtkF0eWw2QDNU9DiFyGcKjzQIk&callback=injectMap';
          document.head.appendChild(map_script);

        } else {
          textP = document.createElement('P');
          textP.setAttribute("id", "noresultP");
          textP.innerHTML = response["shops_response"]["message"];

          textDiv = document.createElement('div');
          textDiv.setAttribute("id", "noresultDiv");
          textDiv.appendChild(textP);

          // productLogo = document.createElement("div"); productLogo.setAttribute("class", "product-logo");
          // textDiv.appendChild(productLogo);

          document.getElementById("customDiv").appendChild(textDiv);
        }
      });


    });
  } else {
    console.log("Cant find user location :(");
  }
}

function removeMap() {
  var customDiv = document.getElementById("customDiv");
  while (customDiv.hasChildNodes()) {
    customDiv.removeChild(customDiv.lastChild);
  }
}

// https://stackoverflow.com/questions/9515704/insert-code-into-the-page-context-using-a-content-script

