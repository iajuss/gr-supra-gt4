// A pit box painted on the studio floor: side and back lines around the car and a lime stop mark ahead of
// its nose. It gives the car a place to stand, and the lines draw the floor's perspective.

import { CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

/**
 * Opaque along the middle, fading to nothing at both ends: long lines die out before they reach the page's
 * text columns, which a hard-edged box ran straight under.
 */
function fadeAlongLength(fade) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(fade, '#fff');
  gradient.addColorStop(1 - fade, '#fff');
  gradient.addColorStop(1, '#000');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 1);
  return new CanvasTexture(canvas);
}

/**
 * @param {typeof import('../data/carStage.js').default.pitBox} config metres, centred on the car (nose +x)
 * @returns {{ object3D: Group, dispose: () => void }}
 */
export function createPitBox({ length, width, stroke, lineColor, fade, stop }) {
  const fadeMap = fadeAlongLength(fade);
  const sides = new MeshStandardMaterial({
    color: lineColor,
    roughness: 0.8,
    metalness: 0,
    alphaMap: fadeMap,
    transparent: true,
    depthWrite: false,
  });
  const paint = new MeshStandardMaterial({ color: lineColor, roughness: 0.8, metalness: 0 });
  const lime = new MeshStandardMaterial({
    color: stop.color,
    emissive: stop.color,
    emissiveIntensity: stop.glow,
    roughness: 0.8,
    metalness: 0,
  });

  const object3D = new Group();
  const line = (along, across, x, z, material) => {
    const geometry = new PlaneGeometry(along, across);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, 0.01, z); // a hair above the floor, below the contact shadows
    object3D.add(mesh);
  };

  line(length, stroke, 0, width / 2, sides);
  line(length, stroke, 0, -width / 2, sides);
  line(stroke, width, -length / 2, 0, paint); // the box stays open ahead of the car
  line(stop.width, width * stop.share, length / 2 - stop.inset, 0, lime);

  return {
    object3D,
    dispose() {
      object3D.traverse((child) => child.isMesh && child.geometry.dispose());
      sides.dispose();
      paint.dispose();
      fadeMap.dispose();
      lime.dispose();
    },
  };
}
