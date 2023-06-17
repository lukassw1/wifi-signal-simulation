<script lang="ts">
import P5 from 'p5-svelte';
import type { Image, Renderer } from 'p5';
import type { Sketch } from 'p5-svelte';

const H = 100; 
const L = 2 * H + 1; // number of nodes
const v = 0.1;
const dt = 1 / 60;
const dx = 1 / L;
const pixelSize = 2
const c = v * v * dt * dt / dx / dx;
const defaultImg = "basic-apartment_1_f_w.png";

let amplitude = 127;
let omega = 6;
let frequency = 2.4;
let damping = 0.1;
let t = 0;

let img: Image | null = null;
let walls = new Array(L);

// Absorption layer thicknesses (outer layer)
const a_r = 50; // right
const a_l = 50; // left
const a_t = 50; // top
const a_b = 50; // bottom
const a_h = a_r + a_l; // horizontal combined
const a_v = a_t + a_b; // vertical combined
const a_s = a_h + a_v; // sum


let u = new Array(L + a_s); // u(t)
let u_next = new Array(L + a_s); // u(t+dt)
let u_prev = new Array(L + a_s); // u(t-dt)

let currentRouterIndex: number | null = null;
let dragging = false;
let stop = false;

interface RouterState {
	x: number;
	y: number;
}

let routers: RouterState[] = [{x: 110, y: 110}];

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

const toggleSimulation = () => {
	stop = !stop;
}

let selectedFrequency = frequency;

const processFrequency = () => {
	frequency = selectedFrequency;
}

let selectedAmplitude = amplitude;

const processAmplitude = () => {
	amplitude = selectedAmplitude;
}

let selectedDamping = damping;

const processDamping = () => {
	damping = selectedDamping;
}

const sketch: Sketch = (p5) => {
	let canvas: Renderer | null = null;
	
	const step = () => {
		// Edge absorbing layer - left
		for (let x = 1; x < a_l; ++x) {
			for (let y = 1; y < L - 1 + a_v; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;
				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
				u_next[x][y] -= (a_l / x) * damping * dt * (u[x][y] - u_prev[x][y]);

			}
		}

		// Edge absorbing layer - right
		for (let x = L + a_l; x < L - 1 + a_h; ++x) {
			for (let y = 1; y < L - 1 + a_v; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;
				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
				u_next[x][y] -= (a_r / (a_h - x + L - 1)) * damping * dt * (u[x][y] - u_prev[x][y]);
			}
		}

		// Edge absorbing layer - top
		for (let x = a_l; x < L + a_l - 1; ++x) {
			for (let y = 1; y < a_t; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;
				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
				u_next[x][y] -= (a_t / y) * damping * dt * (u[x][y] - u_prev[x][y]);
			}
		}

		// Edge absorbing layer - bottom
		for (let x = a_l; x < L + a_l - 1; ++x) {
			for (let y = L + a_t; y < L - 1 + a_v; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;
				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
				u_next[x][y] -= (a_b / (a_h - y + L - 1)) * damping * dt * (u[x][y] - u_prev[x][y]);
			}
		}

		// moving by dt
		for (let x = a_l; x < L + a_l; ++x) {
			for (let y = a_t; y < L + a_t; ++y) {
				u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
				u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
				u_next[x][y] *= c;

				u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];

				if (x > a_l && x < L - 1 + a_l && y > a_t && y < L - 1 + a_t) {
					u_next[x][y] *= walls[x - a_l][y - a_t];
				}

				u_next[x][y] -= damping * dt * (u[x][y] - u_prev[x][y]);
			}
		}
		
		for (let i = 0; i < L + a_h; ++i) {
			// moving forward
			u_prev[i] = u[i].slice();
			u[i] = u_next[i].slice();
		}
		
		t += dt;
	}

	const clean = () => {
		for (let i = 0; i < L + a_h; ++i) {
			u[i] = new Array(L + a_v).fill(0);
			u_next[i] = new Array(L + a_v).fill(0);
			u_prev[i] = new Array(L + a_v).fill(0);
		}
	};

	const makeWalls = () => {
		for (let i = 0; i < L; ++i) {
			walls[i] = new Array(L).fill(1);
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

	const loadImage = (source: string) => {
		p5.loadImage(source, (newImg) => {
			if (newImg.width === L && newImg.height === L) {
				// potential TODO: scale image to LxL
				makeWallsFromImg(newImg);
				img = newImg;
			} else {
				alert("Wrong dimensions. Got " + newImg.width + "x" + newImg.height + ". Expected " + L + "x" + L + ".");
			}
		}, (err) => {
			alert("Failed to load image.");
		});
	}

	const mouseInCanvas = (mouseX: number, mouseY: number) => {
		let canvasMouseX = mouseX / pixelSize;
		let canvasMouseY = mouseY / pixelSize;
		
		return canvasMouseX > 0 && canvasMouseX < L && canvasMouseY > 0 && canvasMouseY < L;
	}

	const bringBackContextMenu = () => {
		canvas?.elt.removeEventListener("contextmenu", preventContextMenuHandler);
	}

	const preventContextMenuHandler = (e: MouseEvent) => {
		e.preventDefault();
		setTimeout(bringBackContextMenu, 100);
	}

	const preventContextMenu = () => {
		canvas?.elt.addEventListener("contextmenu", preventContextMenuHandler);
	}

	p5.mousePressed = () => {
		if (currentRouterIndex !== null) {
			if (p5.mouseButton == p5.LEFT) {
				dragging = true;
			} else if (p5.mouseButton == p5.RIGHT) {
				try {
					// Disable context menu - this might be blocked in some browsers
					preventContextMenu();
				} finally {
					// Remove router from the list
					routers.forEach((_, routerIndex) => {
						if (routerIndex === currentRouterIndex) {
							routers.splice(routerIndex, 1);
						}
					});
				}
			}
		} else if (p5.mouseButton == p5.LEFT && mouseInCanvas(p5.mouseX, p5.mouseY)) {
			routers.push({x: p5.round(p5.mouseX / pixelSize), y: p5.round(p5.mouseY / pixelSize)});
		}
	}

	p5.mouseDragged = () => {
		if (dragging && mouseInCanvas(p5.mouseX, p5.mouseY)) {
			routers[currentRouterIndex!].x = p5.max(p5.min(p5.round(p5.mouseX / pixelSize), L), 0);
			routers[currentRouterIndex!].y = p5.max(p5.min(p5.round(p5.mouseY / pixelSize), L), 0);
		}
	}

	p5.mouseReleased = () => {
		dragging = false;
	}

	p5.preload = () => {
		img = p5.loadImage(defaultImg);
	}

	p5.setup = () => {
		canvas = p5.createCanvas(L * pixelSize , L * pixelSize);

		makeWalls();
		makeWallsFromImg(img!);
		clean();

		imageLoader = loadImage;
		cleaner = clean;
	}

	p5.draw = () => {
		// Distance to the closest router
		let minDistance = Infinity;
		let currentRouterTemp = -1;

		routers.forEach((routerState, routerIndex) => {
			let routerDistance = p5.dist(routerState.x, routerState.y, p5.mouseX / pixelSize, p5.mouseY / pixelSize);

			if (minDistance > routerDistance) {
				minDistance = routerDistance;
				currentRouterTemp = routerIndex;
			}
			
			if (!stop && !(dragging && routerIndex === currentRouterIndex)) {
				u[routerState.x + a_l][routerState.y + a_t] = amplitude * p5.sin(frequency * omega * t);
			}
		});

		if (minDistance > 5) {
			currentRouterIndex = null;
		} else {
			currentRouterIndex = currentRouterTemp;
		}

		if (img === null) {
			return;
		}
		
		if (!stop) {
			// update values
			step();
		}

		// update image
		img.loadPixels();

		for (let x = a_l; x < L + a_l; ++x) {
			for (let y = a_t; y < L + a_t; ++y) {
				if (walls[x - a_l][y - a_t] <= 0.99) {
					img.set(x - a_l, y - a_t, p5.color(p5.floor(walls[x - a_l][y - a_t] * 255)));
				} else {
					let c = u[x][y] * 5;

					if (c > 0) {
						img.set(x - a_l, y - a_t, p5.color(255, 255-c, 255-c));
					} else {
						img.set(x - a_l, y - a_t, p5.color(255+c, 255, 255+c));
					}
				}
			}
		}

		img.updatePixels();
		p5.image(img, 0, 0, p5.width, p5.height);

		if (currentRouterIndex !== null) {
			p5.strokeWeight(16);
			p5.stroke(p5.color(0, 0, 0));
			p5.point(routers[currentRouterIndex].x * pixelSize + 1, routers[currentRouterIndex].y * pixelSize + 1);
		}

		routers.forEach((routerState) => {
			p5.strokeWeight(8);
			p5.stroke(p5.color(0, 0, 200));
			p5.point(routerState.x * pixelSize + 1, routerState.y * pixelSize + 1);
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

<label>
	Ustaw obraz planszy:
	<input type="file" bind:files on:change={onFileChange} accept="image/png, image/jpeg" />
</label>

<br class="buttons">

<div class="buttons">
<button on:click={onClean}>Wyczyść</button>
</div>

<div class="buttons">
	<button on:click={toggleSimulation}>
	{#if stop}
		Wznów symulację
	{:else}
		Zatrzymaj symulację
	{/if}
	</button>
</div>

<label>
	Wartość częstotliwości
	<input bind:value={selectedFrequency} type="range" min="0" max="5" step="0.01">
	<input bind:value={selectedFrequency} type="number" step="0.1">
	<button on:click={processFrequency}>Zmień</button>
</label>

<br class="buttons">

<label>
	Wartość amplitudy
	<input bind:value={selectedAmplitude} type="range" min="0" max="500" step="0.1">
	<input bind:value={selectedAmplitude} type="number">
	<button on:click={processAmplitude}>Zmień</button>
</label>

<br class="buttons">

<label>
	Współczynnik tłumienia w ośrodku
	<input bind:value={selectedDamping} type="range" min="0" max="2" step="0.01">
	<input bind:value={selectedDamping} type="number" step="0.1">
	<button on:click={processDamping}>Zmień</button>
</label>