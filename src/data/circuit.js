// Circuit data used by THE LAP. Geometry: bacinger/f1-circuits (MIT), see silverstone.json.

import silverstone from './silverstone.json';

export default {
  name: silverstone.properties.Name,
  lengthMetres: silverstone.properties.length,
  coordinates: silverstone.geometry.coordinates,

  // The GeoJSON loop begins on the pre-2011 start straight (Woodcote → Copse).
  // The current start/finish line is on Hamilton Straight, between Club and Abbey:
  // placed midway between the two braking zones (≈3196 m of 5878 m).
  startProgress: 0.544,

  // Approximate sector boundaries, as lap fractions from the Hamilton Straight line:
  // S1 ends on Wellington Straight, S2 ends on Hangar Straight.
  sectorSplits: [0.25, 0.745],
};
