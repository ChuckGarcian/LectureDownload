document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("mybutton");
  button.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.runtime.sendMessage(
        { message: "getHTML", tabId: activeTab.id },
        function (response) {
        
            // var htmlContent = response.html;
            // var fileName = 'page.html';
            // var link = document.createElement('a');
            // link.download = fileName;
            // link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
            // link.click();
          
        }
      );
    });
    //alert("button clicked!");
  });
});
