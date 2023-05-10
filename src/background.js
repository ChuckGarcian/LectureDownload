//import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
console.log("hello world")
var linksx = [];
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message == "getHTML") {
      chrome.scripting.executeScript(
        {
          target: {tabId: request.tabId},
          function: function() {
            // var htmlContent = document.documentElement.outerHTML;
            // var fileName = 'page.html';
            // var link = document.createElement('a');
            // link.download = fileName;
            // link.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
            // link.click();
            alert("test1");

            const prefix = "https://lecturecapture.la.utexas.edu";
            alert("Initial linksx value:");

            // var matchingLinks = Array.from(document.querySelectorAll('a'))
            //   .filter(link => link.href.startsWith(prefix));

           // linksx = matchingLinks.map(link => link.href);
            //linksx.push("hello");
           

            const links = Array.from(document.querySelectorAll('a'));
            // linksx = (Array.from(document.querySelectorAll('a'))).map(link => link.href).filter(link => link.startsWith(prefix));
            const extractedLinks = links
            .map(link => link.href)
            .filter(link => link.startsWith(prefix));
            
            //linksx = extractedLinks.slice();
            // we extracted the links, now we need to use pupiteer to iterate through
            // the array and retrieve all the .m3u8
            //alert(extractedLinks);
           
            chrome.runtime.sendMessage({ message: "extractedLinks", extractedLinks : extractedLinks});
        
            alert("test 2");
            //sendResponse({html: document.documentElement.outerHTML});
          }
        }
      );
      return true;
    }
  })


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "extractedLinks") {
      console.log(linksx)
      console.log(request.extractedLinks);
      //linksx = JSON.parse(JSON.stringify(request.extractedLinks));
      linksx = deepCopyArray(request.extractedLinks);
      console.log(request.extractedLinks);
      console.log(linksx)
      proccessLinks()
    }
  });
 function deepCopyArray(arr) {
    const copy = Array.isArray(arr) ? [] : {};
    for (let key in arr) {
      const value = arr[key];
      copy[key] = (typeof value === 'object' && value !== null) ? deepCopyArray(value) : value;
    }
    return copy;
}
const tabIdsToIntercept = new Set();

var index = 0;
// We now have the links in an array so we go one by one
// to extract the .m3u8
function proccessLinks() {
 
    if (linksx.length === 0) return
    const link = linksx.shift();
    chrome.tabs.create({ url: link, active: false }, function(tab) {
        // Injects the newly created tab with a content.js script that will 
        // send a message to trigger a web request interception for the .m3u8 file
        tabIdsToIntercept.add(tab.id)
        //extractData(tab.id)
       // chrome.runtime.sendMessage({message : "pageCreated", newTabID : tab.id})
        // chrome.scripting.executeScript({
        //   target: {tabId: tab.id},
        //   files: ['src/content.js']
        // })
       
        
    })
    
    
}
// chrome.runtime.addListener(function(request, sender, sendResponse) {
//     if (request.message === "pageCreated") {

//     }
// })
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (tabIdsToIntercept.has(details.tabId) && details.url.includes("chunklist_")) {
      console.log("Computed Computed!");
      //alert("Ig we can alert but not console log")
      // Add a delay before removing the tab
     
      //setTimeout(() => {
      //   chrome.tabs.remove(details.tabId);
      //   proccessLinks(linksx);
     // }, 1000); // 1-second delay
     
     // tabIdsToRemove.add(details.tabId);
      
    }
  },
  { urls: ["<all_urls>"] }
);

// Once the tab is fuly finish loading we can go ahead and
// remove it. This ensure that chrome won't fucking complain that im modifying the tab when its still
// loading in
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   if (changeInfo.status === "complete") {
//     if (tabIdsToIntercept.has(tabId)) {
//       console.log("Tab " + tabId + " has finished loading");
//       index = index + 1;
//       console.log(index);
//       chrome.tabs.remove(tabId);
//       proccessLinks(linksx);
//       tabIdsToIntercept.delete(tabId);
//     }
 
//     // Do something when the tab has finished loading
//   }
// });

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == "complete") {
    // Tab has finished loading
    chrome.tabs.get(tabId, function(tab) {
      if (tab.status === "complete" && tab.status != "loading") {
        if (tabIdsToIntercept.has(tabId)) {
          console.log("Tab " + tabId + " has finished loading");
          index = index + 1;
          console.log(index);
          chrome.tabs.remove(tabId);
          proccessLinks(linksx);
          tabIdsToIntercept.delete(tabId);
        }      
      }
    });
    // setTimeout(function() {
      
    // }, 2000); // Wait 1 second to check if tab is still making requests
  }
});



//  extracts the .m3u8 link 
// function extractData(tabID) {
//   console.log("listen for .3mu8")
//   chrome.tabs.remove(tabID)
// }
// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//   // a new page was loaded and we detected it
//   if (message.type === "pageLoaded") {
    
//     /*
//     chrome.webRequest.onBeforeRequest.addListener(function(details) {
//       if (details.url.startsWith('https://streaming-lectures.la.utexas.edu')) {
//         console.log("intercepted link: ", details)
//       }
//     }, { urls: ['<all_urls>'] },
//     ['blocking'])
//     */

//   }
// })
