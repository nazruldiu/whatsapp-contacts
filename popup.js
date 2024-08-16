document.addEventListener('DOMContentLoaded', function() {
  const grabButton = document.getElementById('grab');
  const numberList = document.getElementById('numbers'); 
  const runButton = document.getElementById('re_run');
  const messageAgain = document.getElementById('message_again');
  
  if (grabButton) {
    grabButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].url.includes('web.whatsapp.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { message: 'getNumbers' }, (response) => {
            numberList.innerHTML = '';
            if (response && response.numbers) {
              response.numbers.forEach((number) => {
                const li = document.createElement('li');
                li.textContent = number;
                numberList.appendChild(li);
              });
            } else {
              numberList.innerHTML = '<li>No numbers found.</li>';
            }
          });
        } else {
          console.log('This extension only works on web.whatsapp.com.');
        }
      });
    });
  } else {
    console.error('Grab button not found');
  }
  
  if (runButton){
		runButton.addEventListener('click', () => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0].url.includes('web.whatsapp.com')) {
			  chrome.tabs.sendMessage(tabs[0].id, { message: 'reRunProcess' }, (response) => {
				numberList.innerHTML = response;
			  });
			} else {
			  console.log('This extension only works on web.whatsapp.com.');
			}
		  });
		});
	}
	
	if (messageAgain){
		messageAgain.addEventListener('click', () => {
			const from_date = document.getElementById('from_date').value; 
			const to_date = document.getElementById('to_date').value; 
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0].url.includes('web.whatsapp.com')) {
			  chrome.tabs.sendMessage(tabs[0].id, {
				  message: 'messageAgain',
				  fromDate: from_date, 
				  toDate: to_date 
				  }, (response) => {
					numberList.innerHTML = response;
			  });
			} else {
			  console.log('This extension only works on web.whatsapp.com.');
			}
		  });
		});
	}
});


