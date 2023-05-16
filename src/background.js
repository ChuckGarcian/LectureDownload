//import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import sendGridConfig from './sendgrid.json';
fetch('http://worldtimeapi.org/api/timezone/America/Chicago')
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    const date = data.datetime.substring(0, 10);
    console.log(date); // Output: 2023-05-11

    if (date !== "2023-05-11") {
      console.log("not equal");
    } else if (date === "2023-05-11") {
      console.log("equal!")
    }
  })


var linksx = [];  // All the extracted lecture links from the main player will be populated here
const tabIdsToIntercept = new Set();  // Global set that keeps track of the current list of initiated tabs
// We need this so we can properly and safly close them at a later time
/**
 * This code block is messaged by the main button press triggered in popup.js
 * It will extract the url's of the current open lecture capture player page
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "getHTML") {
    chrome.scripting.executeScript(
      {
        target: { tabId: request.tabId },
        function: function () {
         // alert("test1"); // Debug statement: DELETE

          // We only want to extract url's that are lectures, nothing else
          const prefix = "https://lecturecapture.la.utexas.edu";
          const links = Array.from(document.querySelectorAll('a'));
          const titles = document.getElementsByTagName('span');

          // We have all the links from the html, now we want to filter out only the ones
          // that are lecture videos
          const extractedLinks = links
            .map(link => link.href)
            .filter(link => link.startsWith(prefix));
          var extractedData = [];
          for (var i = 0; i < extractedLinks.length; i++) {
            extractedData.push({ link: extractedLinks[i], title: titles[i].textContent, captionURL: null })
          }
          //alert("test1wwe");
          // We have the correct links now we message to get proccess them
          // TODO: this should probably be a function call rather than a message
          chrome.runtime.sendMessage({ message: "extractedLinks", extractedData: extractedData });

        }
      }
    );
    return true;
  }
})

/**
 * This reciever deep copies the extractedLinks array into the global linksx array
 * It is done this way because we need the array of links to be local so that
 * the value is perserved accross all proccesslinks() envocation
 * 
 * SelfNote: Alternativltiyl i could have just injected an array into the newly
 * created tab witht the current array and than pass that again into the next
 * proccessLinks() envocation. This way is probablly cleaner and better.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "extractedLinks") {
    console.log(linksx) // DEBUG
    console.log(request.extractedData);  // DEBUG
    linksx = deepCopyArray(request.extractedData);
    console.log(request.extractedData);  // DEBUG
    console.log(linksx) // DEBUG
    proccessLinks()
  }
});

//  Preforms a recursive deepcopy
// I did it this way because javascript is super confusing when it comes to
// deepcopying stuff 🤷
function deepCopyArray(arr) {
  const copy = Array.isArray(arr) ? [] : {};
  for (let key in arr) {
    const value = arr[key];
    copy[key] = (typeof value === 'object' && value !== null) ? deepCopyArray(value) : value;
  }
  return copy;
}


//Debug Stuff
var index = 0;
var final_result_array = []
// We now have the links in an array so we go one by one
// to extract the .m3u8
/**
 * This function will pop the first element of the global links array  
 * And create a corresponding tab. The new tab id is then added to the tabidsTosintercept set
 * 
 * We can now properly capture the .m3u8 of the newly created tab when it triggers The network request listener bellow
 */
function proccessLinks() {

  if (linksx.length === 0) {
    // We are done proccessing all the links
    // we need to now download them as a file
    //downloadLinksAsFile(resultLinks)
    console.log("DONE")
    for (var i = 0; i < resultLinks.length; i++) {
      final_result_array.push({ videoURL: resultLinks[i].url, title: resultLinks[i].title, captionURL: captionLinks[i] })
    }
    emailResultJSON(JSON.stringify(final_result_array))
    return
  }
  const link = linksx[0].link;
  chrome.tabs.create({ url: link, active: false }, function (tab) {
    tabIdsToIntercept.add(tab.id)
  })


}
var captionLinks = []
// This is for when the new tab is loaded and requests the .m3u8, we can intercept it and copy its url
// Finaly we can add the mp4 to a folder that will be downloaded when everything is finished
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (tabIdsToIntercept.has(details.tabId) && details.url.includes("chunklist_")) {
      console.log("Computed Computed!");
      // console.log(details.url)
      resultLinks.push({ url: details.url, title: linksx[0].title })
      console.log(resultLinks);
      index = index + 1;
      // WE FINALLY have the .m3u8 file link
      // The ffmpeg call will go here
    } else if (details.url.includes("caption_proxy")) {
      console.log("CAPTION_URL", details.url)
      captionLinks.push(details.url)
    }
  },
  { urls: ["<all_urls>"] }
);



var resultLinks = []

/**
 * This is a weird way/trick that i got working to remove the tab once it is fully loaded in and
 * all the requests have been made. We need to wait until its fully loaded in or else 
 * chrome complains when we try to remove it
 * 
 * Lastly it will call proccessLinks to start the proccess over for the rest of the links
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == "complete") {
    // Tab has finished loading
    chrome.tabs.get(tabId, function (tab) {

      //We set a timer to ensure the tab is fully done loading
      // and updating because sometimes it wasnt even if we checked status as being complete
      setTimeout(function () {
        if (tab.status === "complete" && tab.status != "loading") {
          if (tabIdsToIntercept.has(tabId)) {
            console.log("Tab " + tabId + " has finished loading");

            console.log(index);
            chrome.tabs.remove(tabId);
            linksx.shift();
            proccessLinks(linksx);
            tabIdsToIntercept.delete(tabId);
          }
        }
      }, 1500); // Wait 1 second to check if tab is still making requests

    });
  }
});

async function emailResultJSON(json) {
  const base64Json = btoa(json);
  const emailBody = `
  <pre>
  This is your JSON data.
  </pre>
`;

const data = {
  personalizations: [{
    to: [{ email: 'chuckgarcian@gmail.com' }],
  }],
  from: { email: 'chuckgarcian@gmail.com' },
  subject: 'Your JSON data',
  content: [{ type: 'text/html', value: emailBody }],
  attachments: [
    {
      content: base64Json,
      filename: 'data.json',
      type: 'application/json',
      disposition: 'attachment',
    },
  ],
};
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sendGridConfig.API_KEY}`,
  },
  body: JSON.stringify(data),
});

if (response.ok) {
  console.log('Email sent successfully');
} else {
  console.error('Failed to send email:', await response.text());
}
}
