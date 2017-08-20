chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  console.log("Removing tab details from storage : " + tabId);
  chrome.storage.local.remove(tabId.toString());
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  sender_id = sender.tab.id.toString();

  switch(msg.method_name) {
    case "get_tab_status":
      console.log("Fetching tab status : " + sender_id);
      get_tab_status(sender_id).then(function(response){
        sendResponse({ tab_status: response });
      }).catch(function(response){});
      break;

    case "disable_search":
      console.log("Disabling search : " + sender_id);
      set_to_storage("global_status", "disabled");
      set_to_storage(sender_id, "disabled");

      sendResponse({ status: "disabled" });
      break;

    case "enable_search":
      console.log("Enabling search : " + sender_id);
      set_to_storage("global_status", "enabled");
      set_to_storage(sender_id, "enabled");

      sendResponse({ status: "enabled" });
      break;

    case "get_shops":
      console.log("Fetching shops for tag : " + msg.search_text);
      var http = new XMLHttpRequest();
      var params = "search_text=" + msg.search_text + "&latitude=" + msg.latitude + "&longitude=" + msg.longitude
      console.log(params);
      http.open("GET", "http://localhost:3006/search_chrome_extension?"+params, true);
      http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
          response = JSON.parse(http.responseText)
          console.log(response);
          console.log(response["message"]);
          console.log(response["status_code"]);
          console.log(response["results"]);
          sendResponse({ shops_response: response });
        }
      }
      http.send(null);
      break;

    default:
      console.log("No method found with name : " + msg.method_name);
  }

  return true;
});


function get_tab_status(sender_tab) {
  console.log("sender : " + sender_tab);

  return new Promise(function(resolve, reject){
    get_from_storage(sender_tab).then(function(response){
      if (response) {
        resolve(response);
      } else {
        get_global_status().then(function(response){
          console.log("Fetching global_status : " + response);
          set_to_storage(sender_tab, response);
          resolve(response);
        }).catch(function(response){});
      }
    }).catch(function(response){});
  });
}

function get_global_status() {
  default_status = "disabled"
  set_to_storage("global_status", default_status);

  return new Promise(function(resolve, reject){
    get_from_storage("global_status").then(function(response){
      if (response) {
        resolve(response);
      } else {
        set_to_storage("global_status", default_status);
        resolve(default_status);
      }
    }).catch(function(response){
      resolve(default_status);
    });
  });
}

function get_from_storage(key) {
  return new Promise(function(resolve, reject){
    chrome.storage.local.get(key, function(key_value){
      resolve(key_value[key]);
    });
  });
}

function set_to_storage(key, value) {
  var obj = {};
  obj[key] = value;
  chrome.storage.local.set(obj);
}
