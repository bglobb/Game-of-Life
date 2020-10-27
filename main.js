// By Ben Lobb

'use strict';

var c, gl, vs_source, fs_source, fs2_source, vs, fs, fs2, program, program2, vertices, t_vertices, vbo, tbo, pal, tal, cal, data_location, tex_in, tex_out, fb, arr_out, main_loop, state;
var t = 0;
var w = window.innerWidth;
var h = window.innerHeight;

window.onload = function() {
  c = document.getElementById("canvas");
  c.width = w;
  c.height = h;
  gl = c.getContext("webgl")||c.getContext("experimental-webgl");
  vs_source =
`
precision lowp float;
attribute vec2 vert_pos;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
void main() {
  v_texcoord = a_texcoord;
  gl_Position = vec4(vert_pos, 0, 1);
}
`
  fs_source = [
    "precision lowp float;",
    "varying vec2 v_texcoord;",
    "uniform sampler2D data;",
    "float x;",
    "float y;",
    "float sum;",
    "float w = TBD1.0;",
    "float h = TBD2.0;",
    "vec4 curr;",
    "bool state;",
    "float col;",
    "void main() {",
    "  x = v_texcoord.x;",
    "  y = 1.0-v_texcoord.y;",
    "  sum = float(texture2D(data, vec2(x-1.0/w, y-1.0/h)).r==1.0)*float(x!=0.5/w&&y!=0.5/h)+float(texture2D(data, vec2(x-1.0/w, y)).r==1.0)*float(x!=0.5/w)+float(texture2D(data, vec2(x-1.0/w, y+1.0/h)).r==1.0)*float(x!=0.5/w&&y!=1.0-0.5/w)+float(texture2D(data, vec2(x, y-1.0/h)).r==1.0)*float(y!=0.5/h)+float(texture2D(data, vec2(x, y+1.0/h)).r==1.0)*float(y!=1.0-0.5/h)+float(texture2D(data, vec2(x+1.0/w, y-1.0/h)).r==1.0)*float(x!=1.0-0.5/w&&y!=0.5/h)+float(texture2D(data, vec2(x+1.0/w, y)).r==1.0)*float(x!=1.0-0.5/w)+float(texture2D(data, vec2(x+1.0/w, y+1.0/h)).r==1.0)*float(x!=1.0-0.5/w&&y!=1.0-0.5/h);",
    "  curr = texture2D(data, vec2(x, y));",
    "  state = sum>1.5&&sum<3.5&&curr.r==1.0||sum==3.0&&curr.r<1.0;",
    "  col = max(curr.r-0.01, float(state));",
    "  gl_FragColor = vec4(col, 0, 0, 1);",
    "}"
  ]
  fs2_source =
  `
    precision lowp float;
    varying vec2 v_texcoord;
    uniform sampler2D data;
    void main() {
      gl_FragColor = texture2D(data, v_texcoord);
    }
  `
  fs_source[6] = fs_source[6].replace("TBD1", w);
  fs_source[7] = fs_source[7].replace("TBD2", h);
  vs = gl.createShader(gl.VERTEX_SHADER);
  fs = gl.createShader(gl.FRAGMENT_SHADER);
  fs2 = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vs, vs_source);
  gl.shaderSource(fs, fs_source.join('\n'));
  gl.shaderSource(fs2, fs2_source);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.compileShader(fs2);
  program = gl.createProgram();
  program2 = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.attachShader(program2, vs);
  gl.attachShader(program2, fs2);
  gl.linkProgram(program2);

  // Create buffer
  vertices = new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  t_vertices = new Float32Array([
    0, 1,
    0, 0,
    1, 1,
    1, 0
  ])
  fb = gl.createFramebuffer();
  vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  pal = gl.getAttribLocation(program, 'vert_pos');
  gl.vertexAttribPointer(
    pal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(pal);

  tbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
  tal = gl.getAttribLocation(program, 'a_texcoord');
  gl.vertexAttribPointer(
    tal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, t_vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(tal);


  var arr = [];
  for (var i = 0; i < w*h; i++) {
    state = Math.random()<0.5?255:0;
    arr.push(state);
    arr.push(0); arr.push(state); arr.push(0);
  }
  arr = new Uint8Array(arr);
  arr_out = new Uint8Array(w*h*4);
  tex_in = texture(arr, w, h);
  tex_out = texture(arr_out, w, h);
  data_location = gl.getUniformLocation(program, "data");
  main_loop = setInterval(loop, t)
}

function loop() {
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex_in);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex_out);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_out, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.useProgram(program2);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.deleteTexture(tex_in);
  tex_in = tex_out;
  tex_out = texture(arr_out, w, h);
}

function texture(data, width, height) {
  var tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return tex;
}

function speed_up() {
  t = Math.max(0, t-1);
  change_speed();
}

function slow_down() {
  t+=1;
  change_speed();
}

function change_speed() {
  clearInterval(main_loop);
  main_loop = setInterval(loop, t);
}
