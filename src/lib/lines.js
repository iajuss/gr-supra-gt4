// Pure helper for splitting text into visual lines (the DOM measuring lives in components/textReveal.js).

const SAME_LINE_TOLERANCE = 2; // px

/**
 * Groups word indices into lines from each word's measured top offset (in reading order).
 * @param {number[]} tops
 * @returns {number[][]}
 */
export function groupByLine(tops) {
  const lines = [];
  let lineTop = null;

  tops.forEach((top, index) => {
    if (lineTop === null || Math.abs(top - lineTop) > SAME_LINE_TOLERANCE) {
      lines.push([]);
      lineTop = top;
    }
    lines.at(-1).push(index);
  });

  return lines;
}
