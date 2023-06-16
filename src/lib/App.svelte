<script lang="ts">
import P5 from 'p5-svelte';
import type { Image, Renderer } from 'p5';
import type { Sketch } from 'p5-svelte';

const H = 100; 
const L = 2 * H + 1; // number of nodes
const v = 0.1;
const dt = 1 / 60;
const dx = 1 / L;
const pixel_size = 2
const c = v * v * dt * dt / dx / dx;

let amplitude = 127;
let omega = 6;
let frequency = 2.4;
let t = 0;
let img: Image | null = null;
let u = new Array(L); // u(t)
let u_next = new Array(L); // u(t+dt)
let u_prev = new Array(L); // u(t-dt)
let walls = new Array(L); // walls
let currentRouterIndex: number | null = null;
let dragging = true;

interface RouterState {
	x: number;
	y: number;
}

let routers: RouterState[] = [{x: 100, y: 100}];

let files: FileList;

type LoadImage = (source: string) => void;

let imageLoader: LoadImage | null = null;

const onFileChange = () => {
	imageLoader?.(URL.createObjectURL(files[0]));
}

type Cleaner = () => void;

let cleaner: Cleaner | null = null;

const onClean = () => {
	cleaner?.();
}

let selectedFrequency = frequency;

const processFrequency = () => {
	frequency = selectedFrequency;
}

let selectedAmplitude = amplitude;

const processAmplitude = () => {
	amplitude = selectedAmplitude;
}

const sketch: Sketch = (p5) => {
	let canvas: Renderer | null = null;
	
	const step = () => {
		// moving by dt
		for (let x = 1; x < L - 1; ++x) {
			for (let y = 1; y < L - 1; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;
				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
				u_next[x][y] *= walls[x][y]
			}
		}

		// edges
		for (let x = 0; x < L; ++x) {
		u_next[x][0] = u_next[x][1];
		u_next[0][x] = u_next[1][x];
		u_next[x][L - 1] = u_next[x][L - 2];
		u_next[L - 1][x] = u_next[L - 2][x];
		}
		
		for (let i = 0; i < L; ++i) {
			// moving forward
			u_prev[i] = u[i].slice();
			u[i] = u_next[i].slice();
		}
		t += dt;
	}

	const clean = () => {
		for (let i = 0; i < L; ++i) {
			u[i] = new Array(L).fill(0);
			u_next[i] = new Array(L).fill(0);
			u_prev[i] = new Array(L).fill(0);
		}
	};

	const makeWalls = () => {
		for (let i = 0; i < L; ++i) {
			walls[i] = new Array(L).fill(1);
		}

		for (let i = 50; i < 151; ++i){
			walls[i][50] = 0.7
		}
	}

	const makeWallsFromImg = (bgImg: Image) => {
		bgImg.loadPixels();

		const d = p5.pixelDensity();

		for (let x = 0; x < L; ++x) {
			for (let y = 0; y < L; ++y) {
				let idx = 4  * d * (x +  L * y * d);
				let r = bgImg.pixels[idx];
				let g = bgImg.pixels[idx + 1];
				let b = bgImg.pixels[idx + 2];
				let luminance = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);

				if (luminance > 0.99) {
					walls[x][y] = 1;
				} else {
					walls[x][y] = luminance;
				}
			}
		}
	}

	const onLoadImage = (source: string) => {
		p5.loadImage(source, (newImg) => {
			if (newImg.width === L && newImg.height === L) {
				// potential TODO: scale image to LxL
				makeWallsFromImg(newImg);
			} else {
				alert("Wrong dimensions. Got " + newImg.width + "x" + newImg.height + ". Expected " + L + "x" + L + ".");
			}
		}, (err) => {
			alert("Failed to load image.");
		});
	}

	const mouseInCanvas = (mouseX: number, mouseY: number) => {
		let canvasMouseX = mouseX / pixel_size;
		let canvasMouseY = mouseY / pixel_size;
		
		return canvasMouseX > 0 && canvasMouseX < L && canvasMouseY > 0 && canvasMouseY < L;
	}

	p5.mousePressed = () => {
		if (currentRouterIndex !== null) {
			if (p5.mouseButton == p5.LEFT) {
				dragging = true;
			} else if (p5.mouseButton == p5.RIGHT) {
				try {
					// Disable context menu - this might be blocked in some browsers
					canvas?.elt.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault());
					setTimeout(() => {
						canvas?.elt.addEventListener("contextmenu", () => {});
					}, 100);
				} finally {
					// Remove router from the list
					routers.forEach((_, routerIndex) => {
						if (routerIndex === currentRouterIndex) {
							routers.splice(routerIndex, 1);
						}
					});
				}
			}
		} else if (mouseInCanvas(p5.mouseX, p5.mouseY)) {
			routers.push({x: p5.round(p5.mouseX / pixel_size), y: p5.round(p5.mouseY / pixel_size)});
		}
	}

	p5.mouseDragged = () => {
		if (dragging && mouseInCanvas(p5.mouseX, p5.mouseY)) {
			routers[currentRouterIndex!].x = p5.max(p5.min(p5.round(p5.mouseX / pixel_size), L), 0);
			routers[currentRouterIndex!].y = p5.max(p5.min(p5.round(p5.mouseY / pixel_size), L), 0);
		}
	}

	p5.mouseReleased = () => {
		dragging = false;
	}

	p5.setup = () => {
		canvas = p5.createCanvas(L * pixel_size , L * pixel_size);
		img = p5.createImage(L, L);

		clean();
		makeWalls();

		imageLoader = onLoadImage;
		cleaner = clean;
	}

	p5.draw = () => {
		// Distance to the closest router
		let minDistance = Infinity;

		routers.forEach((routerState, routerIndex) => {
			let routerDistance = p5.dist(routerState.x, routerState.y, p5.mouseX / pixel_size, p5.mouseY / pixel_size);

			if (minDistance > routerDistance) {
				minDistance = routerDistance;
				currentRouterIndex = routerIndex;
			}

			u[routerState.x][routerState.y] = amplitude * p5.sin(frequency * omega * t);
		});

		if (minDistance > 5) {
			currentRouterIndex = null;
		}
		
		// update values
		step();

		if (img == null) {
			return;
		}

		// update image
		img.loadPixels();

		for (let x = 0; x < L; ++x) {
			for (let y = 0; y < L; ++y) {
				if (walls[x][y] <= 0.99) {
					img.set(x, y, p5.color(p5.floor(walls[x][y] * 255)));
				} else {
					let c = u[x][y] * 5;

					if (c > 0) {
						img.set(x, y, p5.color(255, 255-c, 255-c));
					} else {
						img.set(x, y, p5.color(255+c, 255, 255+c));
					}
				}
			}
		}

		img.updatePixels();
		p5.image(img, 0, 0, p5.width, p5.height);

		if (currentRouterIndex !== null) {
			p5.strokeWeight(16);
			p5.stroke(p5.color(0, 0, 0));
			p5.point(routers[currentRouterIndex].x * pixel_size + 1, routers[currentRouterIndex].y * pixel_size + 1);
		}

		routers.forEach((routerState) => {
			p5.strokeWeight(8);
			p5.stroke(p5.color(0, 0, 200));
			p5.point(routerState.x * pixel_size + 1, routerState.y * pixel_size + 1);
		});
	}
};

</script>

<style>
.buttons {
	margin-bottom: 10px; /* Adjust the desired gap size here */
}
</style>

<P5 {sketch} />

<br class="buttons">

<label class="buttons">
	Ustaw obraz planszy
	<input type="file" bind:files on:change={onFileChange} accept="image/png, image/jpeg" />
</label>

<br class="buttons">

<div class="buttons">
<button on:click={onClean}>Wyczyść</button>
</div>

<label>
	Wartość częstotliwości (domyślnie 2.4)
	<input bind:value={selectedFrequency} type="number">
	<button on:click={processFrequency}>Zmień</button>
</label>

<br>

<label>
	Wartość omega (domyślnie 6
	<input bind:value={selectedAmplitude} type="number">
	<button on:click={processAmplitude}>Zmień</button>
</label>