function fetchText() {
  fetch('/get-text/')
    .then(response => response.json())
    .then(data => {
      document.getElementById('displayText').textContent = data.text;
    });
}

function submitText() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value;
  
  fetch('/save-text/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({text: text})
  })
  .then(response => response.json())
  .then(data => {
    textInput.value = '';
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

   const targetVolume = Math.min(1, (x / (2 *  (window.innerWidth))));
    hum.volume = targetVolume;

});





// Load text on page load and refresh every 500ms
fetchText();
setInterval(fetchText, 500);
