#include <webassembly.h>
#include <math.h>
#include <stdlib.h>

int PARTICLE_COUNT = 0;
int PADDING = 2;

import void printi(int);
import void printfl(float);
import void printxy(int, int);
import int getTime();
import float randomf();

struct Ball {
  float x;
  float y;
  float vx;
  float vy;
};

struct Ball ball = { 
  .x = 0.0, .y = 0.0,
  .vx = 0.0, .vy = 0.0
};

int width = 0;
int height = 0;

struct Particle {
  float x;
  float y;
  float z;
};

struct Particle *particles;
struct Particle *cparticles;
struct Particle *oparticles;

export int getParticleCount() {
  return PARTICLE_COUNT;
}

export int getParticleByteSize() {
  return sizeof (struct Particle);
}

export struct Particle* getParticleColorOffset() {
  return &cparticles[0];
}

export struct Particle* getParticlePositionOffset() {
  return &particles[0];
}

export void updateMouse(int x, int y) {
  ball.x = (float) x;
  ball.y = (float) y;
}

export void init(int ww, int hh) {
  width = ww;
  height = hh;
  PARTICLE_COUNT = (width * height) / PADDING;
  int amount = (width * height) * getParticleByteSize();
  particles = malloc(amount);
  oparticles = malloc(amount);
  cparticles = malloc(amount);
  for (int ii = 0; ii < PARTICLE_COUNT; ++ii) {
    float xx = (ii % (width)) * PADDING;
    float yy = (ii / (width)) * PADDING;
    particles[ii].x = randomf() * width;
    particles[ii].y = randomf() * height;
    oparticles[ii].x = xx;
    oparticles[ii].y = yy;
    cparticles[ii].x = (xx / width) * 255.0f;
    cparticles[ii].y = (yy / height) * 255.0f;
    cparticles[ii].z = 128.0f;
  };
}

export int* allocateTexture(int ww, int hh) {
  int size = 4 * (ww * hh);
  int *data = malloc(size * sizeof (*data));
  // initialize with zero
  for (int ii = 0; ii < size; ++ii) data[ii] = 0;
  return data;
}

export void destroyTexture(int **texture) {
  free(*texture);
}

export void drawTexture(int *texture, int x, int y, int ww, int hh) {
  int size = (ww * hh);
  float factor = 0.1f;
  for (int ii = 0; ii < size; ++ii) {
    int px = ii * 4;
    if (texture[px + 3] == 0) continue;
    int r = texture[px + 0];
    int g = texture[px + 1];
    int b = texture[px + 2];
    int xx = x + (ii % ww);
    int yy = y + (ii / ww);
    int ix = yy * width + xx;
    if (ix < 0 || xx >= width || yy >= height) continue;
    //particles[ix].x += 1.0f;
    cparticles[ix].x = r;
    cparticles[ix].y = g;
    cparticles[ix].z = b;
  };
}

void updateBall() {

}

export void tick() {
  int t = (float) getTime();
  float s = 19.75f;
  float ease = 0.05f;
  updateBall();
  float bx = ball.x;
  float by = ball.y;
  for (int ii = PARTICLE_COUNT; ii > 0; --ii) {
    // move back to origin point
    particles[ii].x += (oparticles[ii].x - particles[ii].x) * ease;
    particles[ii].y += (oparticles[ii].y - particles[ii].y) * ease;

    int dx = bx - particles[ii].x;
    int dy = by - particles[ii].y;
    int dist = (dx * dx) + (dy * dy);

    if (dist < 12500) {
      float t = atan2(dy, dx);
      particles[ii].x -= cosf(t) * s;
      particles[ii].y -= sinf(t) * s;
    }

    // resets pixels after each frame (like clearRect)
    // disabled since we dont draw texture based
    //cparticles[ii].x = cparticles[ii].y = cparticles[ii].z = 0.0f;
  };
}
