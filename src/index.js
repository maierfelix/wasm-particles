import { roundTo, load, mergeObjects } from "./utils";

import wgl from "./webgl";
import buffer from "./main.js";

canvas.width = roundTo(window.innerWidth, 2);
canvas.height = roundTo(window.innerHeight, 2);

let width = canvas.width;
let height = canvas.height;

let mx = 0; let my = 0;

const INT_BYTES = Int32Array.BYTES_PER_ELEMENT;
const UINT_BYTES = Uint32Array.BYTES_PER_ELEMENT;
const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;
const DOUBLE_BYTES = Float64Array.BYTES_PER_ELEMENT;

function createTexture(width, height) {
  let offset = program.allocateTexture(width, height);
  //console.log(`Allocated ${width * height * 4} bytes at ${offset}`);
  // this can be used just like ImageData
  let data = new Uint32Array(instance.memory.buffer, offset, 4 * (width * height));
  return ({
    data,
    offset,
    width, height
  });
};

let tex = null;
function draw() {
  let width = 128;
  let height = 128;
  if (tex === null) tex = createTexture(width, height);
  let xx = 0;
  let yy = 0;
  let ww = width;
  let hh = height;
  //program.drawTexture(tex.offset, xx, yy, ww, hh);
};

window.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});

window.addEventListener("mousemove", function(e) {
  if (program === null) return;
  mx = e.clientX;
  my = e.clientY;
  program.updateMouse(mx, my);
});

window.program = null;
let instance = null;
let imports = {
  initialMemory: 512,
  imports: {
    printi: console.log.bind(console),
    printfl: console.log.bind(console),
    printxy: console.log.bind(console),
    powf: Math.pow,
    randomf: Math.random,
    getTime: Date.now
  }
};
load(buffer, imports).then((inst) => {
  instance = inst;
  program = instance.exports;
  console.log("Initialising...");
  program.init(width, height);
  let last = performance.now();
  let frames = 0;
  let ptCount = program.getParticleCount();
  let ptBytes = program.getParticleByteSize();
  let ptSize = (ptBytes / FLOAT_BYTES);
  let ptColorOffset = program.getParticleColorOffset();
  let ptPositionOffset = program.getParticlePositionOffset();
  let ptColor = null;
  let ptPosition = null;
  let totalPtBytes = ptCount * ptBytes * FLOAT_BYTES;
  let usedKb = (totalPtBytes * 0.001) | 0;
  let initKb = (imports.initialMemory * 0x40) | 0;
  console.log(`Allocated ${ptCount} particles`);
  document.querySelector(".lbl").innerHTML = `${ptCount} Particles á ${ptBytes} byte`;
  console.log(`Memory: Used: ${usedKb}kB/${initKb}kB Left: ${initKb-usedKb}kB`);
  let webgl = wgl(ptSize);
  let gl = webgl.gl;
  let prog = webgl.program;
  let xx = 64; let yy = 64;
  let timeLoc = gl.getUniformLocation(prog, "time");
  let count = 0;
  console.log(`Particle size of ${ptSize}/${ptBytes}byte`);
  inst.imports.ongrow = function() {
    // keep track of point data after each memory mutation
    ptColor = new Float32Array(instance.memory.buffer, ptColorOffset, ptCount * ptSize);
    ptPosition = new Float32Array(instance.memory.buffer, ptPositionOffset, ptCount * ptSize);
  };
  inst.imports.ongrow();
  (function drawLoop() {
    requestAnimationFrame(drawLoop);
    program.tick();
    let now = performance.now();
    let dt = (now - last);

    //console.log(`Update took ${then - now}ms`);
    gl.uniform1i(timeLoc, (Date.now()));

    // colors
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, ptColor, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(webgl.colorLoc, 3, gl.FLOAT, false, ptSize * 4, 0);

    // points
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.coordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, ptPosition, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(webgl.coordLoc, 3, gl.FLOAT, false, ptSize * 4, 0);

    gl.drawArrays(gl.POINTS, 0, ptCount);

    let then = performance.now();
    //console.log(`Update took ${then - now}ms`);

    last = now;
    frames++;
  })();
});
