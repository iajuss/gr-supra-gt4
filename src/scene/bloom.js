// Bloom for the car stage, selective: only the car's lamps (meshes marked `userData.glows`) spill light.
// A brightness threshold could not do it: the spots' highlights on the clear coat run brighter than the
// headlights themselves, and bloomed into milky blotches (look lab, 2026-09-19).
//
// The scene is drawn to the canvas as before (its own antialiasing, its own tone mapping). The glow is
// drawn apart and small: the lamps, hidden where the body is in front of them by a coarse copy of the
// shell drawn in black (the model's `occluder`), blurred, and only the blur added over the frame.
// Measured on the laptop, scrolling (2026-09-19): the whole frame through a multisampled half-float
// composer cost ~12 ms a frame, and hiding the lamps with the real body (~2M triangles) another ~6 ms.

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const GLOW_SCALE = 0.25; // the glow is blurred anyway: a quarter of the pixels in each direction

const black = new Color(0x000000);

/**
 * @param {import('three').WebGLRenderer} renderer
 * @param {import('three').Scene} scene
 * @param {import('three').Camera} camera
 * @param {{ strength: number, radius: number, threshold: number }} settings
 */
export function createBloom(renderer, scene, camera, { strength, radius, threshold }) {
  const glowComposer = new EffectComposer(renderer);
  glowComposer.renderToScreen = false;
  glowComposer.setPixelRatio(renderer.getPixelRatio() * GLOW_SCALE);
  glowComposer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), strength, radius, threshold);
  glowComposer.addPass(bloom);

  // Only the blur is added (the pass's own result before it blends the lamps back in): the lamps
  // themselves, at a quarter of the size, came out as blocks. Added as it is, with no tone mapping or
  // encoding, so its faint tails stay faint instead of greying the whole frame.
  const overlay = new FullScreenQuad(
    new ShaderMaterial({
      uniforms: { glowTexture: { value: bloom.renderTargetsHorizontal[0].texture } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D glowTexture;
        varying vec2 vUv;
        void main() {
          vec3 glow = texture2D(glowTexture, vUv).rgb;
          gl_FragColor = vec4(1.0 - exp(-glow), 1.0); // soft ceiling instead of a hard clip
        }`,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    }),
  );

  // For the glow pass: the lamps as they are, the occluder in black, everything else left out.
  const blackShell = new MeshBasicMaterial({ color: black, side: DoubleSide });
  const changed = new Map();

  function lampsOnly(root = scene) {
    root.traverse((object) => {
      // Lines and points are drawn too, and are not meshes: left in, the airflow's lime lines came
      // through the glow pass and bloomed, which the selective bloom exists to prevent.
      const drawn = object.isMesh || object.isLine || object.isPoints;
      if (!drawn || object.userData.glows) return;
      changed.set(object, { visible: object.visible, material: object.material });
      if (object.userData.occluder) {
        object.visible = true;
        object.material = blackShell;
      } else {
        object.visible = false;
      }
    });
  }

  function restore() {
    for (const [object, { visible, material }] of changed) {
      object.visible = visible;
      object.material = material;
    }
    changed.clear();
  }

  // The full-screen passes, as meshes a compile can see (the passes keep their quads to themselves).
  const quad = new PlaneGeometry(2, 2);
  const passes = new Scene();
  for (const material of [
    bloom.materialHighPassFilter,
    ...bloom.separableBlurMaterials,
    bloom.compositeMaterial,
    bloom.blendMaterial,
  ]) {
    passes.add(new Mesh(quad, material));
  }
  const onScreen = new Scene().add(new Mesh(quad, overlay.material));
  let passesCompiled = false;
  // Until the passes have compiled, frames are drawn without the glow: a frame asked for sooner (the
  // stage's first resize) would otherwise wait on the compile and block (~350 ms in one Lighthouse run).
  let passesReady = false;

  /**
   * Compiles, ahead of the first frame, the shaders the glow needs for `object`: its lamps and the
   * occluder as the glow pass draws them (into a target, so without tone mapping: other variants than
   * the frame's), and once, the passes. Compiled lazily, they blocked the first frame for ~0.2–1.2 s
   * (Lighthouse TBT, 2026-09-19). A compile reads the render target when it starts, so the target is
   * set only around that synchronous start.
   * @param {import('three').Object3D} [object]
   */
  function prepare(object = scene) {
    const previous = renderer.getRenderTarget();
    const jobs = [];

    lampsOnly(object);
    renderer.setRenderTarget(glowComposer.readBuffer);
    jobs.push(renderer.compileAsync(object, camera, scene));
    restore();

    if (!passesCompiled) {
      passesCompiled = true;
      renderer.setRenderTarget(bloom.renderTargetsHorizontal[0]);
      const compiled = [renderer.compileAsync(passes, camera)];
      renderer.setRenderTarget(null);
      compiled.push(renderer.compileAsync(onScreen, camera));
      jobs.push(Promise.all(compiled).then(() => (passesReady = true)));
    }

    renderer.setRenderTarget(previous);
    return Promise.all(jobs);
  }

  return {
    prepare,
    render() {
      if (!passesReady) {
        renderer.render(scene, camera);
        return;
      }
      const background = scene.background;
      scene.background = black;
      lampsOnly();
      glowComposer.render();
      restore();
      scene.background = background;

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      overlay.render(renderer);
      renderer.autoClear = autoClear;
    },
    /** @param {number} width CSS pixels @param {number} height */
    setSize(width, height) {
      glowComposer.setSize(width, height);
    },
    dispose() {
      bloom.dispose();
      glowComposer.dispose();
      overlay.material.dispose();
      overlay.dispose();
      blackShell.dispose();
      quad.dispose();
    },
  };
}
