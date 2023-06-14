
// function preload() {
//   img = loadImage('material.png');
// }

function setup() {
  createCanvas(L * pixel_size , L * pixel_size);
  img = createImage(L, L);
  clean();
}

function draw() {
  let A = 127;
  let omega = 6;
  {
    // start point
    u[number_x][number_y] = A * sin(omega * t);
    // update values
    step();
  }
  // update image
  img.loadPixels();
  for (x = 0; x < L; ++x){
    for (y = 0; y < L; ++y) {
      let c = u[x][y];
      c = c * 5
      if (c > 0){
        img.set(x, y, color(255, 255-c, 255-c));
      }
      else {
        img.set(x, y, color(255+c, 255, 255+c));}
      }
    }
  img.updatePixels();
  image(img, 0, 0, width, height);
  
  }

