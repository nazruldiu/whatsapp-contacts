( function() {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  let contactNumbers = new Set();

  function extractNumbersFromIndexedDB() {
    let request = indexedDB.open('model-storage');

    request.onerror = function(event) {
      console.error('Error opening IndexedDB:', event);
    };

    request.onsuccess = function(event) {
      let db = event.target.result;
      let transaction = db.transaction(['contact'], 'readonly');
      let objectStore = transaction.objectStore('contact');
      let contacts = objectStore.getAll();

      contacts.onsuccess = function(event) {
        let result = event.target.result;
        result.forEach((contact) => {
          if (contact.phoneNumber) {
            let number = contact.phoneNumber;
            number = number.replace('@c.us', ''); // Remove @c.us
            if (!number.startsWith('+')) {
              number = '+' + number; // Prepend + if necessary
            }
            contactNumbers.add(number);
          }
        });

        // Log the contact numbers to console for verification
        console.log('Total Contact Numbers:', contactNumbers.size);
		
		// API call start
		// Array of contact to send to the API
        const contact_list = Array.from(contactNumbers);

        // Data to be sent in the request body
        const data = {
            "contact_list": contact_list
        };
		/// new
		var myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");

		var raw = JSON.stringify({
		  contact_list: Array.from(contactNumbers)
		});

		var requestOptions = {
		  method: 'POST',
		  headers: myHeaders,
		  body: raw,
		  redirect: 'follow'
		};
       const apiUrl = 'https://pyschosocial.zapto.org/psycho_social_service/api/contact/'; 
        //const apiUrl = 'http://127.0.0.1:8000/api/contact/'; 
		fetch(apiUrl, requestOptions)
		  .then(response => response.text())
		  .then(result => SendMessageToEachNumber(JSON.parse(result)))
		  .catch(error => console.log('error', error));
		// API call End
      };

      contacts.onerror = function(event) {
        console.error('Error fetching contacts:', event);
      };
    };
  }

  setTimeout(() => {
    // Run the extraction function
    extractNumbersFromIndexedDB();
  }, 10000);
  
  function reRunTheProcess() {
    setInterval(extractNumbersFromIndexedDB, 180000); // Check every 3 minute
	}

  window.addEventListener('load', reRunTheProcess);

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === 'getNumbers') {
      sendResponse({ numbers: Array.from(contactNumbers) });
    }
	if (request.message === 'reRunProcess') {
      extractNumbersFromIndexedDB();
	  sendResponse('Process running successfully!')
    }
	if (request.message === 'messageAgain') {
	  const fromDate = request.fromDate;
      const toDate = request.toDate;
	  setTimeout( async () => {
		 await No_From_Fillup(fromDate, toDate);
	  },1000)     
	  sendResponse('Message Sending successfully!')
    }
  });
})();


function SendMessageToEachNumber(result){
	console.log('New Contact Numbers:', result.created_items.length);
    let interval = { message: 4000, click: 1000 };
    processContacts(result.created_items, {}, '', interval);
}

let wrongContact = [];
let notRegistered = [];
let fileNotSent = [];
let sentContacts = [];
let attachmentContacts = [];

// Helper function to send a message to a single contact
async function sendMessageToContact(contact, message, files, type, interval) {
    try {
        // Open a new chat with the contact
        await newChatButtonClick();
        await wait(interval.click);

        // Wait for the "Message yourself" option and click it
        await messageYourselfClick();
        await wait(interval.click);

        // Wait for the message box to appear and send the contact
        await sendMessageYourself(contact);
        await wait(interval.click);

        // Wait for 1 second before proceeding to message contact box
        await wait(1000);

        // Wait for the phone number link to appear and click it
        const lastSentMessage = await waitForLastSentMessage();
        const phoneNumberLinkSelector = 'span.selectable-text a.selectable-text.copyable-text';
        const phoneNumberLink = await waitForElement(phoneNumberLinkSelector, 5000, lastSentMessage);
        if (phoneNumberLink === "Timeout waiting for element span.selectable-text a.selectable-text.copyable-text") {
            wrongContact.push(contact);
            return false;
        } else {
            phoneNumberLink.click();
            await wait(interval.click);

            // Wait for the "Chat with ....." button to appear and click it
            const chatButtonSelector = 'div[aria-label="Chat with "]';
            const chatButton = await waitForElement(chatButtonSelector);
            if (chatButton === 'Timeout waiting for element div[aria-label="Chat with "]') {
                notRegistered.push(contact);
                return false;
            } else {

                chatButton.click();
                await wait(interval.click);

                if (!(message === '')) {
                    // Wait for the message box to appear and send the message
                    let messageStatus = await sendMessage(message);
                    if (messageStatus) {
                        sentContacts.push(contact);
                    }
                    await wait(interval.click);

                    //2nd message
                    const baseURL = "https://pyschosocial.zapto.org/psycho_social_service/";
                    const completeURL = `${baseURL}${encodeURIComponent(contact)}/`;
                    // const t_msg = `Hi, Please fill the form for free anxiety test. ${completeURL}`;

                    let messageStatus_01 = await sendMessage(completeURL);
                    if (messageStatus_01) {
                        sentContacts.push(contact);
                    }
                    await wait(interval.click);

                    const lastSentMessage_01 = await waitForLastSentMessage();
                    const phoneNumberLinkSelector_01 = 'span.selectable-text a.selectable-text.copyable-text';
                    const phoneNumberLink_01 = await waitForElement(phoneNumberLinkSelector_01, 5000, lastSentMessage_01);
                    
                    // Create a new MouseEvent
                    let event = new MouseEvent('mouseover', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });

                    // Dispatch the event to simulate mouseover
                    phoneNumberLink_01.dispatchEvent(event);
                    const dd_button_Selector = 'span[data-icon="down-context"]'
                    const dd_button = await waitForElement(dd_button_Selector, 5000, lastSentMessage_01);
                    await wait(1000);
                    dd_button.click();

                    await wait(1000);

                    // Create a new MouseEvent
                    let event_01 = new MouseEvent('mouseover', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });

                    const reply = document.querySelector('div[aria-label="Reply"]');
                    reply.dispatchEvent(event_01);
                    await wait(1000);
                    reply.click();
                    await wait(1000);
                    //3rd message (reply)
                    const message_03 = 'Please fillup free Anxiety and depression scale form fill-up garnu hola Ra hami hjr lai fill-up gara pachi report pathauna xam and taspachi k kasto samsya Rahaxa , kasto Anxiety ho tasko bharema hami hjr sanga Kura garna xam Ra kgarna sakinxa Ra hamro service KO bharema Kura garxam';
                    let messageStatus_02 = await sendMessage(message_03);
                    if (messageStatus_02) {
                        sentContacts.push(contact);
                    }
                    await wait(interval.click);
                }          
                return true; // Message sent successfully
            }
        }
    } catch (error) {
        console.log(`%cError sending message to ${contact}: ${error.toString()}`, 'color: blue; font-weight: bold;');
        return false; // Failed to send message
    }
}

// Helper function to wait for the last sent message to appear
async function waitForLastSentMessage() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const sentMessages = document.querySelectorAll('div.message-out');
            const lastSentMessage = sentMessages[sentMessages.length - 1];
            if (lastSentMessage) {
                clearInterval(interval);
                resolve(lastSentMessage);
            } else if (Date.now() - startTime > 5000) { // Adjust timeout as needed
                clearInterval(interval);
                reject('Timeout waiting for last sent message');
            }
        }, 100);
    });
}

// Helper function to clear message box content
async function clearMessageBox(element) {
    element.focus();
    element.textContent = ''; // Clear the text content of the element
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '' }));
    await wait(100); // Wait for changes to apply
}

// Helper function to type text into an element
async function typeIntoElement(element, text) {
    element.focus();
    element.textContent = text;
    // Simulate typing into the element
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
}

// Helper function to wait for an element to appear
function waitForElement(selector, timeout = 5000, parentElement = document) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const element = parentElement.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                resolve(`Timeout waiting for element ${selector}`);
            }
        }, 100);
    });
}

async function checkForSendButton() {
    const maxAttempts = 30; // Max attempts to find the send button
    let attempts = 0;

    const sendInterval = setInterval(async () => {
        attempts++;
        const sendButton = document.querySelector('span[data-icon="send"]');
        if (sendButton) {
            clearInterval(sendInterval);
            sendButton.click();
        } else if (attempts > maxAttempts) {
            clearInterval(sendInterval);
            console.log("%cSend button not found", 'color: blue; font-weight: bold;');
        }
    }, 100); // Check every 100ms
}

async function sendMessage(message) {
    const messageContactBoxSelector = 'div[contenteditable="true"][data-tab="10"]';
    const messageContactBox = await waitForElement(messageContactBoxSelector);
    await clearMessageBox(messageContactBox);
    await typeIntoElement(messageContactBox, message);
    await checkForSendButton();
    console.log(`%cMessage sent`, 'color: green; font-weight: bold;');
    return true;
}

async function sendMessageYourself(contact) {
    const messageSelfBoxSelector = 'div[contenteditable="true"][data-tab="10"]';
    const messageSelfBox = await waitForElement(messageSelfBoxSelector);
    await clearMessageBox(messageSelfBox);
    // Convert contact to string if it's an object
    const contactString = typeof contact === 'object' ? JSON.stringify(contact) : contact;

    // Type the contact into the message box
    await typeIntoElement(messageSelfBox, contactString);
    await checkForSendButton();
    console.log(`%cSelf Message sent - ${contact}`, 'color: green; font-weight: bold;');
}

async function messageYourselfClick() {
    const messageYourselfSelector = 'div._ak8j > div._ak8k._ao-u';
    const messageYourselfOption = await waitForElement(messageYourselfSelector);
    messageYourselfOption.click();
}

async function newChatButtonClick() {
    const newChatButtonSelector = 'div[role="button"][title="New chat"]';
    const newChatButton = await waitForElement(newChatButtonSelector);
    newChatButton.click();
}

// Process each contact and send the message with a 2-second interval
async function processContacts(my_contacts, files, type, interval) {
    for (let i = 0; i < my_contacts.length; i++) {
        sendingMessages = true;
        const contact = my_contacts[i].trim();
		
        const first_msg = `हामी मनोसामाजिक परामर्श सेवाबाट आएका हौं।  हामी 8 वर्ष देखि एक परामर्श सत्र प्रदान गर्दैछौं र हामी मिति सम्म 90% रिकभरी दर छ।  सबै भन्दा पहिले हामी तपाइँको समस्याको बारेमा जान्छौं त्यसको लागि हामी तपाइँलाई नि: शुल्क चिन्ता र डिप्रेसन फारम भर्न चाहन्छौं, तपाइँले फारम भरेपछि हामी तपाइँलाई रिपोर्ट पठाउँछौं र हामी तपाइँसँग समस्याको बारेमा कलमा कुरा गर्छौं।
  (हामी कसरी काम गर्छौं) पहिले, हामी तपाईंको समस्याको विश्लेषण गर्छौं, सल्लाह दिन्छौं, समाधान खोज्छौं र उपचार प्रक्रियालाई प्रशोधन गर्छौं।  यदि कसैले प्रयोग गरिरहेको छ भने हामी औषधि उपलब्ध गराउँदैनौं, हामी तिनीहरूलाई बिस्तारै परामर्श सत्र मार्फत सचेत गराउँछौं।  हाम्रा सेवाहरू मनोवैज्ञानिक, मनोचिकित्सक र डाक्टरहरू मार्फत समस्याको आधारमा गरिन्छ।  
 (हामी के प्रदान गर्दछौं) पहिले 7 दिनको लागि हामी हप्तामा दुई पटक 2 व्यक्तिगत 45/1 घण्टा सत्र प्रदान गर्दछौं जसमा कार्य, दिनचर्या, खाना जाँच सूची, समस्या आधारित समाधान विधि, योग र ध्यान आदि समावेश छ।  र त्यसपछि यदि समस्या सानो छ भने तपाईले छिटो रिकभरी पाउनुहुनेछ र यदि तपाईलाई ठूलो समस्या भयो भने यसले 45 दिनदेखि 3 महिनासम्म लिन सक्छ।  नोट: हाम्रा सेवाहरू अनलाइन र भौतिक रूपमा पनि छन्।  कार्यालय 
 
स्थान: काठमाडौं, रानीबान, पानीट्याङ्की, बनस्थली चोक भित्र र रिङ्गोडबाट १५ मिनेट टाढा।   धन्यवाद`;

        const success = await sendMessageToContact(contact, first_msg, files, type, interval);
        if (success) {
            console.log(`%cMessage sent to ${contact} : Success`, 'color: green; font-weight: bold;');
        } else {
            console.log(`%cMessage sent to ${contact} : Failed`, 'color: red; font-weight: bold;');
        }
        // Wait for interval seconds before sending the next message
        await wait(interval.message);

        // Check if the stop flag is set
        if (!sendingMessages) {
            console.log('Stopping message sending process...');
            return { status: "Message sending stopped." }; // Exit the loop if stop flag is true
        }
    }
    return { status: "Messages sent" };
}

async function wait(time) {
    await new Promise(resolve => setTimeout(resolve, time));
}


async function No_From_Fillup(fromDate, toDate){
	const apiUrl = 'https://pyschosocial.zapto.org/psycho_social_service/api/contact_list_API/'; 
    //const apiUrl = 'http://127.0.0.1:8000/api/contact_list_API/';
	
    // API call start
	var myHeaders = new Headers();
	myHeaders.append("Content-Type", "application/json");

	// Assuming apiUrl is the base URL, append the query parameters
	var apiUrlWithParams = `${apiUrl}?FromDate=${encodeURIComponent(fromDate)}&ToDate=${encodeURIComponent(toDate)}`;

	var requestOptions = {
	  method: 'GET',
	  headers: myHeaders,
	  redirect: 'follow'
	};
	
	fetch(apiUrlWithParams, requestOptions)
	  .then(response => response.text())
	  .then(result => SendMessageToEachNumber(JSON.parse(result)))
	  .catch(error => console.log('error', error));
	// API call End
};