import { describe, it, expect } from 'vitest';
import { wheelContacts } from './wheelContacts.js';

/** A ring of points around a centre, like a tyre seen from above. */
function tyre(x, z, count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return { x: x + Math.cos(angle) * 0.3, z: z + Math.sin(angle) * 0.12 };
  });
}

describe('wheelContacts', () => {
  it('finds the centre of each of the four tyres', () => {
    const points = [...tyre(1.3, 0.8), ...tyre(1.3, -0.8), ...tyre(-1.2, 0.82), ...tyre(-1.2, -0.82)];
    const contacts = wheelContacts(points);
    expect(contacts).toHaveLength(4);
    const sorted = [...contacts].sort((a, b) => b.x - a.x || b.z - a.z);
    const expected = [
      { x: 1.3, z: 0.8 },
      { x: 1.3, z: -0.8 },
      { x: -1.2, z: 0.82 },
      { x: -1.2, z: -0.82 },
    ];
    sorted.forEach((contact, i) => {
      expect(contact.x).toBeCloseTo(expected[i].x, 5);
      expect(contact.z).toBeCloseTo(expected[i].z, 5);
    });
  });

  it('leaves out a corner with no points', () => {
    expect(wheelContacts([...tyre(1.3, 0.8), ...tyre(-1.2, -0.8)])).toHaveLength(2);
  });

  it('returns nothing for no points', () => {
    expect(wheelContacts([])).toEqual([]);
  });
});
