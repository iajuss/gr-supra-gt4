// When each piece of the hero comes in as the page opens, timed against the moment the engine catches
// (the loudest point of the start-up clip). Seconds from the start of the engine clip; without sound
// the same schedule runs on the clip's would-be clock.

// How far ahead of the catch the title starts moving: its ease covers most of the way in this time,
// so it arrives with the engine.
const TITLE_LEAD = 0.1;
// After the title: the kicker, the lead and the scroll cue follow at these delays past the catch.
const FOLLOW = { kicker: 0.25, lead: 0.4, cue: 0.7 };

/**
 * @param {{ catchAt: number }} options
 * @returns {{ title: number, kicker: number, lead: number, cue: number }}
 */
export function entranceSchedule({ catchAt }) {
  return {
    title: Math.max(0, catchAt - TITLE_LEAD),
    kicker: catchAt + FOLLOW.kicker,
    lead: catchAt + FOLLOW.lead,
    cue: catchAt + FOLLOW.cue,
  };
}
