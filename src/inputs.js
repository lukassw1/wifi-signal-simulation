function processXInput() {
  number_x = parseInt(document.getElementById('numberInputX').value);
}
  
function processYInput() {
  number_y = parseInt(document.getElementById('numberInputY').value);
}

function processFrequency() {
  frequency = parseInt(document.getElementById('numberInputFrequency').value);
}

function processAmplitude() {
  amplitude = parseInt(document.getElementById('numberInputAmplitude').value);
}

function processOmega() {
  omega = parseInt(document.getElementById('numberInputOmega').value);
}

function loadImageFromInput(event) {
  loadImage(URL.createObjectURL(event.target.files[0]), (loaded_img) => {
    if (loaded_img.width === L && loaded_img.height === L) {
      // potential TODO: scale image to LxL
      make_walls_from_img(loaded_img);
    } else {
      alert("Wrong dimensions. Got " + loaded_img.width + "x" + loaded_img.height + ". Expected " + L + "x" + L + ".");
    }
  }, (err) => {
    alert("Failed to load image.");
  });
}

function mousePressed() {
  if (over) {
    dragging = true;
  }
}

function mouseDragged() {
  if (dragging) {
    number_x = Math.max(Math.min(Math.round(mouseX / pixel_size), L), 0);
    number_y = Math.max(Math.min(Math.round(mouseY / pixel_size), L), 0);
  }
}

function mouseReleased() {
  dragging = false;
}
