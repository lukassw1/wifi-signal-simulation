function step() {
    // moving by dt
    for (x = 1; x < L - 1; ++x)
      for (y = 1; y < L - 1; ++y) {
        u_next[x][y] = u[x - 1][y] - 2 * u[x][y] + u[x + 1][y];
        u_next[x][y] += u[x][y - 1] - 2 * u[x][y] + u[x][y + 1];
        u_next[x][y] *= c;
        u_next[x][y] += -u_prev[x][y] + 2 * u[x][y];
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