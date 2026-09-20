// The air over the car in the aero chapter: a fan of streamlines (lib/airflow.js) drawn either as
// lines with a mark running along each one, or as dots travelling the same routes. Both ride the
// same maths, so the choice is only how it is drawn.
//
// Like the handheld camera, this draws while nothing else changes, so it runs only where it belongs:
// the camera's own position along the scroll decides how much of it is on screen, and it stops
// altogether away from its chapter, with the tab in the background, or when the frame budget parks it.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineSegments,
  Points,
  PointsMaterial,
  ShaderMaterial,
} from 'three';

import { pointAt, streamlines } from '../lib/airflow.js';

const VERTEX = `
  attribute float aDist;
  varying float vDist;
  void main() {
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// A mark chasing along each line, and both ends of the line faded out so nothing starts or stops
// with a hard edge in mid-air.
const FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uMarks;
  uniform float uSpeed;
  uniform float uHere;
  varying float vDist;
  void main() {
    float phase = fract(vDist * uMarks - uTime * uSpeed);
    float mark = smoothstep(0.0, 0.06, phase) * (1.0 - smoothstep(0.06, 0.5, phase));
    float ends = smoothstep(0.0, 0.14, vDist) * (1.0 - smoothstep(0.86, 1.0, vDist));
    gl_FragColor = vec4(uColor, uOpacity * uHere * mark * ends);
  }
`;

/** Every line as one LineSegments: the whole fan costs a single draw call. */
function buildLines(lines, { color, opacity, marks, speed }) {
  const segments = lines.reduce((sum, line) => sum + (line.length - 1) * 2, 0);
  const position = new Float32Array(segments * 3);
  const distance = new Float32Array(segments);
  let at = 0;

  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i += 1) {
      for (const [point, index] of [[line[i], i], [line[i + 1], i + 1]]) {
        position.set([point.x, point.y, point.z], at * 3);
        distance[at] = index / (line.length - 1);
        at += 1;
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aDist', new BufferAttribute(distance, 1));

  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
      uMarks: { value: marks },
      uSpeed: { value: speed },
      uHere: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const object3D = new LineSegments(geometry, material);
  return {
    object3D,
    step: (seconds, here) => {
      material.uniforms.uTime.value = seconds;
      material.uniforms.uHere.value = here;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/** The same routes walked by dots. Added light, so fading the colour to black fades the dot out. */
function buildDots(lines, { color, opacity, speed, dots, size }) {
  const count = lines.length * dots;
  const position = new Float32Array(count * 3);
  const colours = new Float32Array(count * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('color', new BufferAttribute(colours, 3));

  const tint = new Color(color);
  const material = new PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });

  const object3D = new Points(geometry, material);
  const step = (seconds, here = 1) => {
    let at = 0;
    for (const [lane, line] of lines.entries()) {
      for (let d = 0; d < dots; d += 1) {
        const phase = seconds * speed + d / dots + lane * 0.013;
        const point = pointAt(line, phase);
        position.set([point.x, point.y, point.z], at * 3);
        // Fade in and out at the ends of the route, as the lines do.
        const along = (((phase % 1) + 1) % 1);
        const fade = here * Math.min(1, along / 0.14) * Math.min(1, (1 - along) / 0.14);
        colours.set([tint.r * fade, tint.g * fade, tint.b * fade], at * 3);
        at += 1;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };

  step(0);
  return {
    object3D,
    step,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * @param {{ length: number, width: number, height: number }} car
 * @param {{ view: { add: Function, requestRender: Function } }} options
 * @param {object} config data/carStage.js → airflow, plus any lib/airflow.js shape
 */
export function createAirflow(car, { view }, { mode, ...config }) {
  const lines = streamlines(car, config);
  const drawing = mode === 'dots' ? buildDots(lines, config) : buildLines(lines, config);
  view.add(drawing.object3D);
  drawing.object3D.visible = false;

  let parked = false;
  let here = 0;
  let frame = 0;
  let start = 0;

  function draw(now) {
    if (parked || here <= 0) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    drawing.step((now - start) / 1000, here);
    view.requestRender();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function run() {
    if (frame || parked || here <= 0 || document.hidden) return;
    start = performance.now();
    frame = requestAnimationFrame(draw);
  }

  const onVisibility = () => (document.hidden ? stop() : run());
  document.addEventListener('visibilitychange', onVisibility);

  return {
    /**
     * How much of the flow belongs on screen, 0 to 1 (lib/airflow.js → nearStop): the camera's own
     * place along the scroll, so the air belongs to its chapter and to no other.
     * @param {number} next
     */
    setHere(next) {
      const was = here;
      here = parked ? 0 : next;
      if (here > 0 === was > 0) return;
      drawing.object3D.visible = here > 0;
      if (here > 0) run();
      else stop();
      view.requestRender();
    },
    /** Given up for good, when the frame budget cannot afford something that draws forever. */
    park() {
      if (parked) return;
      parked = true;
      here = 0;
      stop();
      drawing.object3D.visible = false;
      view.requestRender();
    },
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      drawing.object3D.removeFromParent();
      drawing.dispose();
    },
  };
}
