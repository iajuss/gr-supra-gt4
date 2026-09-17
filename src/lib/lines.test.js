import { describe, it, expect } from 'vitest';
import { groupByLine } from './lines.js';

describe('groupByLine', () => {
  it('groups consecutive word indices that share a vertical offset', () => {
    expect(groupByLine([0, 0, 0, 48, 48, 96])).toEqual([[0, 1, 2], [3, 4], [5]]);
  });

  it('tolerates sub-pixel differences within the same line', () => {
    expect(groupByLine([10, 10.4, 9.8, 58.2])).toEqual([[0, 1, 2], [3]]);
  });

  it('returns an empty list for no words', () => {
    expect(groupByLine([])).toEqual([]);
  });
});
