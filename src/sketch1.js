let img;
let pixelSize = 10;

function preload() {
  img = loadImage('material.png');  // Replace with the actual path to your image
}

function setup() {
  createCanvas(img.width * pixelSize, img.height * pixelSize);  // Set the canvas size based on pixel size
  pixelDensity(1);  // Set pixel density to 1 to avoid blurry rendering
  img.resize(width / pixelSize, height / pixelSize);  // Resize the image to match the canvas size
}

function draw() {
  background(20);

  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let pixelColor = img.get(x, y);  // Get the color of the pixel from the original image
      drawPixel(x, y, pixelColor);  // Draw a pixel at the specified position with the pixel color
    }
  }
}

function drawPixel(x, y, color) {
  let startX = x * pixelSize;
  let startY = y * pixelSize;
  
  for (let i = 0; i < pixelSize; i++) {
    for (let j = 0; j < pixelSize; j++) {
      set(startX + i, startY + j, color);
    }
  }
}