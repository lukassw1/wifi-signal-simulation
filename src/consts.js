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
let img;
let u = new Array(L); // u(t)
let u_next = new Array(L); // u(t+dt)
let u_prev = new Array(L); // u(t-dt)
let walls = new Array(L); // walls



function clean(){
    for (let i = 0; i < L; ++i) {
        u[i] = new Array(L).fill(0);
        u_next[i] = new Array(L).fill(0);
        u_prev[i] = new Array(L).fill(0);
    }
}


function make_walls(){
    for (let i = 0; i < L; ++i) {
        walls[i] = new Array(L).fill(1);
    }

    for (let i = 50; i < 151; ++i){
        walls[i][50] = 0.6
    }

}

let number_x = 100;
let number_y = 100;