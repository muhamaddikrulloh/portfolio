export const vertexShader = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float mobile;
uniform float band;
uniform float scrollFade;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.13, 0.47, 0.71));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float field(vec3 p) {
  float n = noise(p) * 0.58;
  n += noise(p * 2.07 + 7.3) * 0.28;
  n += noise(p * 4.11 + 2.8) * 0.14;
  return n;
}
float threshold(vec2 p) {
  vec2 a = mod(floor(p), 2.0);
  vec2 b = mod(floor(p / 2.0), 2.0);
  vec2 c = mod(floor(p / 4.0), 2.0);
  float x = a.x*2.0 + a.y*3.0 - a.x*a.y*4.0;
  float y = b.x*2.0 + b.y*3.0 - b.x*b.y*4.0;
  float z = c.x*2.0 + c.y*3.0 - c.x*c.y*4.0;
  return (x*16.0 + y*4.0 + z + 0.5) / 64.0;
}
float surface(vec3 p) {
  float angle = time * 0.13 + pointer.x * 0.22;
  p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
  float distort = (field(p * 2.3 + vec3(0, time*0.12, time*0.08)) - 0.5) * 0.58;
  distort += sin(p.y*3.5 + time*0.24) * 0.08;
  return length(p) - 0.96 - distort;
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 bg = vec3(11.0/255.0);
  vec3 ink = vec3(243.0, 242.0, 237.0) / 255.0;
  float bayer = threshold(gl_FragCoord.xy);
  if (band > 0.5) {
    float haze = field(vec3(uv * vec2(4.8, 2.2), 0.0));
    float fold = pow(0.5+0.5*sin(uv.y*15.0 + haze*8.0 + uv.x*3.0), 2.0);
    float density = haze * fold * 0.62;
    float veil = 0.6 * (1.0 - abs(uv.y * 2.0 - 1.0));
    gl_FragColor = vec4(mix(bg, ink, step(bayer, density) * 0.35 * veil), 1.0);
    return;
  }
  float wide = smoothstep(1.8, 2.4, resolution.x/resolution.y);
  vec2 center = mix(vec2(mix(0.63, 0.74, wide), 0.55), vec2(0.5, 0.81), mobile);
  float radius = mix(0.43, 0.165, mobile);
  vec2 p = (uv - center) * vec2(resolution.x/resolution.y, 1.0) / radius;
  p -= pointer * vec2(0.08, 0.035);
  p /= 1.0 + length(pointer) * 0.08;
  vec3 ro = vec3(0,0,3.3);
  vec3 rd = normalize(vec3(p, -2.9));
  float distanceAlong = 1.8;
  float hit = 0.0;
  vec3 pos = ro;
  if (dot(p,p) < 2.1) {
    for (int i=0; i<48; i++) {
      pos = ro + rd * distanceAlong;
      float d = surface(pos);
      if (d < 0.005) { hit = 1.0; break; }
      distanceAlong += max(d * 0.8, 0.005);
      if (distanceAlong > 4.8) break;
    }
  }
  float atmosphere = (0.2 + 0.8*smoothstep(0.0,0.7,uv.x)) * (0.15+0.85*smoothstep(0.0,0.8,uv.y));
  float value = step(0.975, bayer) * 0.16 * mix(atmosphere, 0.2+0.8*uv.y, mobile);
  if (hit > 0.5) {
    vec2 e = vec2(0.012,0);
    vec3 normal = normalize(vec3(surface(pos+e.xyy)-surface(pos-e.xyy),
                                 surface(pos+e.yxy)-surface(pos-e.yxy),
                                 surface(pos+e.yyx)-surface(pos-e.yyx)));
    float light = max(0.0, dot(normal, normalize(vec3(-0.65,0.8,1.3))));
    float cavities = field(pos*3.3 + time*0.03);
    float shade = clamp(0.08 + light * 0.82 - cavities*0.18, 0.04, 0.94);
    value = step(bayer, shade);
  }
  gl_FragColor = vec4(mix(bg, ink, value * (1.0-scrollFade*0.8)), 1.0);
}
`;
