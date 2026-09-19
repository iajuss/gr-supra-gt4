// The engine clip played when the visitor enters with sound (components/engineSound.js).
// PROVISIONAL (2026-09-19): streams Pixabay's preview of a BMW M4 (S55, a twin-turbo straight six, the
// B58's closest relative found with a usable licence). Once the final recording is chosen, the trimmed
// file goes to public/audio/, `src` points there and `start`/`end` cover the whole file.
// Times in seconds.

export default {
  src: 'https://cdn.pixabay.com/download/audio/2022/03/12/audio_497bd68caa.mp3?filename=freesound_community-audio-m4-wav-50124.mp3',
  start: 0,
  end: 5,
  volume: 0.8,
  fadeIn: 0.03,
  fadeOut: 0.9,
  credit: {
    title: 'AUDIO M4 WAV',
    author: 'freesound_community',
    url: 'https://pixabay.com/sound-effects/city-audio-m4-wav-50124/',
    license: 'Pixabay Content License',
  },
};
