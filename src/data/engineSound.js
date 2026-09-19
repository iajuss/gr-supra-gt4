// The engine clip played when the visitor enters with sound (components/engineSound.js).
// A BMW Z3 starting and revving: "car-start" by Erdie on Freesound (CC BY 4.0, credited in the footer),
// trimmed to its first 5.5 s from the site's HQ preview. The file is the whole clip, so `start`/`end`
// cover all of it. Times in seconds.

export default {
  src: '/audio/engine-start.mp3',
  start: 0,
  end: 5.5,
  volume: 0.8,
  fadeIn: 0.03,
  fadeOut: 0.9,
  credit: {
    title: 'car-start',
    author: 'Erdie',
    url: 'https://freesound.org/people/Erdie/sounds/21741/',
    license: 'CC BY 4.0',
  },
};
