// The engine clip played when the visitor enters with sound (components/engineSound.js).
// A BMW Z3 starting and revving: "car-start" by Erdie on Freesound (CC BY 4.0, credited in the footer),
// trimmed to its first 9 s from the site's HQ preview: the start, the revs and the settle back to idle.
// Times in seconds.

export default {
  src: '/audio/engine-start.mp3',
  start: 0,
  // The whole take, so the engine settles back to idle instead of being cut while it revs.
  end: 9,
  volume: 0.8,
  fadeIn: 0.03,
  fadeOut: 2.5,
  // A room around it (lib/impulse.js) and a little more low end: the recording alone sounded dry.
  space: { wet: 0.3, seconds: 1.6, decay: 3.5, lowShelf: { frequency: 140, gain: 4 } },
  // The engine catches (the loudest point of the start-up) this far into the clip: the hero's title
  // lands on it (lib/heroEntrance.js). Measured on the trimmed file.
  catchAt: 0.4,
  credit: {
    title: 'car-start',
    author: 'Erdie',
    url: 'https://freesound.org/people/Erdie/sounds/21741/',
    license: 'CC BY 4.0',
  },
};
