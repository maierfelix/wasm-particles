function compileShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export default function initRender (ptSize) {

  let gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false
  });

  gl.depthMask(false);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let program = gl.createProgram();

  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER,
    `
    attribute vec3 aColor;
    attribute vec3 aPosition;
    varying vec3 vColor;
    uniform vec2 res;
    uniform int time;
    void main(void) {
      vColor = aColor / 255.0;
      vec2 circle = aPosition.xy / res * vec2(2, -2) - vec2(1, -1);
      gl_Position = vec4(circle, 0, 1);
      gl_PointSize = 1.0;
    }
  `));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER,
    `precision lowp float;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor.r, vColor.g, vColor.b, 1.0);
    }
  `));

  gl.linkProgram(program);
  gl.useProgram(program);

  let resLoc = gl.getUniformLocation(program, "res");
  gl.uniform2f(resLoc, canvas.width, canvas.height);

  gl.viewport(0, 0, canvas.width, canvas.height);

  let coordBuffer = gl.createBuffer();
  let colorBuffer = gl.createBuffer();

  let coordLoc = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(coordLoc);

  let colorLoc = gl.getAttribLocation(program, "aColor");
  gl.enableVertexAttribArray(colorLoc);

  return {
    gl, program,
    coordBuffer, colorBuffer,
    coordLoc, colorLoc
  };

};
