function fetchText() {
  fetch('/get-text/')
    .then(response => response.json())
    .then(data => {
      window._allMessages = data.messages || [];
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
document.getElementById('textInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    submitText();
  }
});

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
    hum.play();

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







// Load text on page load and refresh every 500ms
fetchText();
setInterval(fetchText, 500);
