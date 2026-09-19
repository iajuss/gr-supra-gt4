import { describe, it, expect } from 'vitest';
import { choiceFromKey } from './soundGate.js';

describe('choiceFromKey', () => {
  it.each(['a', 'k', 'ArrowDown', 'PageDown', '1', 'F5'])('"%s" starts the engine', (key) => {
    expect(choiceFromKey(key)).toBe('sound');
  });

  it('Escape enters without sound', () => {
    expect(choiceFromKey('Escape')).toBe('silent');
  });

  it.each(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'])('"%s" is left alone (focus and shortcuts)', (key) => {
    expect(choiceFromKey(key)).toBeNull();
  });

  it('Enter and Space start the engine, unless a button has focus (its own click decides)', () => {
    expect(choiceFromKey('Enter')).toBe('sound');
    expect(choiceFromKey(' ')).toBe('sound');
    expect(choiceFromKey('Enter', { onButton: true })).toBeNull();
    expect(choiceFromKey(' ', { onButton: true })).toBeNull();
  });

  it('Escape still enters silently from a button', () => {
    expect(choiceFromKey('Escape', { onButton: true })).toBe('silent');
  });
});
