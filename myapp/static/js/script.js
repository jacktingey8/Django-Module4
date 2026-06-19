function fetchText() {
  fetch('/get-text/')
    .then(response => response.json())
    .then(data => {
      window._allMessages = data.messages || [];
      
      // Filter out any messages that were recently deleted locally
      if (window._recentlyDeleted && window._recentlyDeleted.size > 0) {
        window._allMessages = window._allMessages.filter(msg => !window._recentlyDeleted.has(msg.id));
      }
      
      if (!window._allMessages.length) {
        document.getElementById('displayText').textContent = 'Double-click anywhere to add a message';
      }
    });
}

function submitText() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value;
  
  // include coordinates if available
  const payload = { text: text };
  if (window._lastClick && typeof window._lastClick.x === 'number') {
    payload.x = window._lastClick.x;
    payload.y = window._lastClick.y;
  }

  fetch('/save-text/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    textInput.value = '';
    // hide modal if open
    const modal = document.getElementById('inputModal');
    if (modal) modal.style.display = 'none';
    // clear stored click
    window._lastClick = null;
    fetchText();
  });
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Allow Enter key to submit
const textInput = document.getElementById('textInput');
if (textInput) {
  textInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      submitText();
    }
  });
}

// Double-click anywhere to open the input modal at that position
document.addEventListener('dblclick', (e) => {
  // store last click coords relative to viewport
  const x = e.clientX;
  const y = e.clientY;
  window._lastClick = { x: x, y: y };

  const modal = document.getElementById('inputModal');
  const input = document.getElementById('textInput');
  if (!modal || !input) return;

  // position modal, adjust so it doesn't overflow the viewport
  const modalWidth = 360; // approximate
  const modalHeight = 60; // approximate
  let left = x;
  let top = y;
  if (left + modalWidth > window.innerWidth) left = window.innerWidth - modalWidth - 12;
  if (top + modalHeight > window.innerHeight) top = window.innerHeight - modalHeight - 12;

  modal.style.left = `${left}px`;
  modal.style.top = `${top}px`;
  modal.style.display = 'flex';
  input.focus();
});

// Cancel button handling
const cancelBtn = document.getElementById('cancelBtn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    const modal = document.getElementById('inputModal');
    if (modal) modal.style.display = 'none';
    window._lastClick = null;
    document.getElementById('textInput').value = '';
  });
}

// Send button wiring
const sendBtn = document.getElementById('sendBtn');
if (sendBtn) {
  sendBtn.addEventListener('click', () => submitText());
}

const hum = new Audio('/static/audio/cease.wav');
hum.loop=true;


document.addEventListener('click', () => {
  hum.play().catch(error => {
    console.log("Audio autoplay was blocked by the browser:", error);
  });
}, { once: true });

// Fetch initial text when page loads
fetchText();

document.addEventListener('mousemove', (e) => {
    const circle = document.querySelector('.circle');
    let x = e.clientX;
    let y = e.clientY;
    const r = Math.round((x / window.innerWidth) * 255);
    const g = Math.round((y / window.innerHeight) * 255);
    const b = 150;

    circle.style.backgroundColor = `rgb(${r}, ${g}, ${b})`

    let newVolume = 0;
    let closestMsg = null;
    let closestDist = Infinity;

    if (window._allMessages && window._allMessages.length > 0) {
      for (const msg of window._allMessages) {
        if (msg.x !== null && msg.y !== null) {
          const dx = x - msg.x;
          const dy = y - msg.y;
          const dist = Math.hypot(dx, dy);
          if (dist < closestDist) {
            closestDist = dist;
            closestMsg = msg;
          }
        }
      }

      if (closestDist !== Infinity) {
        const maxRadius = Math.hypot(window.innerWidth, window.innerHeight) * 0.1;
        const proximity = Math.max(0, 1 - closestDist / maxRadius);
        newVolume = Math.min(1, proximity);
      }
    } else {
      newVolume = Math.min(1, (x / (2 * window.innerWidth)));
    }

    hum.volume = newVolume;
    circle.style.filter = `blur(${Math.max(0, 20 - (newVolume * 20))}px)`;

    if (closestMsg) {
      const maxDist = Math.hypot(window.innerWidth, window.innerHeight) * 0.2;
      const proximity = Math.max(0, 1 - closestDist / maxDist);
      circle.style.transform = `scale(${1 + (5 * proximity)})`;
      document.getElementById('displayText').textContent = closestMsg.text;
    } else {
      circle.style.transform = 'scale(1)';
      document.getElementById('displayText').textContent = 'Double-click anywhere to add a message';
    }
});




/**
 * Monitors mouse state and removes a message if the user holds 
 * down the click while within a 3px proximity threshold.
 */
function enableHoldToDelete() {
  let holdTimer = null;
  const HOLD_DURATION = 2000; // Time in milliseconds required to hold click
  const PROXIMITY_THRESHOLD = 3; // 3-pixel boundary

  // Tracks global mouse position during a click hold
  let currentX = 0;
  let currentY = 0;
  let activeTargetMsg = null;

  // 1. Keep track of current mouse coordinates globally
  document.addEventListener('mousemove', (e) => {
    currentX = e.clientX;
    currentY = e.clientY;

    // If the user is currently holding down click but moves out of the 3px zone, cancel the deletion
    if (holdTimer && activeTargetMsg) {
      const dx = currentX - activeTargetMsg.x;
      const dy = currentY - activeTargetMsg.y;
      const dist = Math.hypot(dx, dy);

      if (dist > PROXIMITY_THRESHOLD) {
        clearTimeout(holdTimer);
        holdTimer = null;
        activeTargetMsg = null;
        console.log("Deletion canceled: Mouse moved out of the 3px threshold.");
      }
    }
  });

  // 2. Intercept mouse down events to check proximity and initiate hold timer
  document.addEventListener('mousedown', (e) => {
    // Only trigger on primary left click
    if (e.button !== 0) return; 

    if (!window._allMessages || window._allMessages.length === 0) return;

    // Find if the cursor is within 3px of any message coordinates
    let closestMsg = null;
    let closestDist = Infinity;

    for (const msg of window._allMessages) {
      if (msg.x !== null && msg.y !== null) {
        const dx = currentX - msg.x;
        const dy = currentY - msg.y;
        const dist = Math.hypot(dx, dy);

        if (dist < closestDist) {
          closestDist = dist;
          closestMsg = msg;
        }
      }
    }

    // If within the tight 3px threshold, start the countdown
    if (closestDist <= PROXIMITY_THRESHOLD && closestMsg) {
      activeTargetMsg = closestMsg;
      
      holdTimer = setTimeout(() => {
        executeMessageDeletion(activeTargetMsg);
        holdTimer = null;
        activeTargetMsg = null;
      }, HOLD_DURATION);
    }
  });

  // 3. Clear the timer if the user releases the click early
  document.addEventListener('mouseup', () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      activeTargetMsg = null;
    }
  });

  // Helper function to communicate the deletion to the backend
  function executeMessageDeletion(messageToDelete) {
    console.log("Proximity hold verification successful. Deleting:", messageToDelete);

    // Initialize the recently deleted tracking set if needed
    if (!window._recentlyDeleted) {
      window._recentlyDeleted = new Set();
    }

    // Track the deleted message ID to prevent it from reappearing
    if (messageToDelete.id) {
      window._recentlyDeleted.add(messageToDelete.id);
    }

    // Optimistically update local cache UI state immediately
    window._allMessages = window._allMessages.filter(msg => msg !== messageToDelete);

    // Clear the display text if the deleted message is currently being shown
    const displayText = document.getElementById('displayText');
    if (displayText && displayText.textContent === messageToDelete.text) {
      displayText.textContent = 'Double-click anywhere to add a message';
    }

    // Send delete request to backend server
    fetch('/delete-text/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') // Reuses your cookie security token helper
      },
      body: JSON.stringify({
        text: messageToDelete.text,
        x: messageToDelete.x,
        y: messageToDelete.y
      })
    })
    .then(response => {
      if (!response.ok) throw new Error("Network response failure during deletion step.");
      return response.json();
    })
    .catch(err => {
      console.error("Failed to persist deletion on server:", err);
    });
  }
}

// Initialize the event listeners
enableHoldToDelete();




// Load text on page load and refresh every 500ms
fetchText();
setInterval(fetchText, 500);
