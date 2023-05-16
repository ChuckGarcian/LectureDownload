document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("mybutton");
  button.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.runtime.sendMessage(
        { message: "getHTML", tabId: activeTab.id });
    });
    //alert("button clicked!");
  });
});
