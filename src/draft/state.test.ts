import { describe, expect, test } from 'vitest';
import { createInitialState, draftReducer } from './state';
import type { DraftSettings, PlayerId } from '../types';

const settings: DraftSettings = {
  rounds: 2,
  managers: Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, name: `Manager ${i}` })),
  myManagerId: 'm0',
};

const id = (s: string) => s as PlayerId;
const fresh = () => createInitialState(settings);

describe('createInitialState', () => {
  test('sizes the board to rounds x managers, all empty', () => {
    const state = fresh();
    expect(state.picks).toHaveLength(24);
    expect(state.picks.every((p) => p === null)).toBe(true);
    expect(state.history).toEqual([]);
  });
});

describe('setPick', () => {
  test('fills the target slot and leaves others alone', () => {
    const state = draftReducer(fresh(), {
      type: 'setPick',
      pickNumber: 3,
      playerId: id('chase'),
    });

    expect(state.picks[3]?.playerId).toBe('chase');
    expect(state.picks.filter((p) => p !== null)).toHaveLength(1);
  });

  test('overwrites an occupied slot', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 0, playerId: id('a') });
    state = draftReducer(state, { type: 'setPick', pickNumber: 0, playerId: id('b') });

    expect(state.picks[0]?.playerId).toBe('b');
  });

  test('does not mutate the previous state', () => {
    const before = fresh();
    const after = draftReducer(before, { type: 'setPick', pickNumber: 1, playerId: id('x') });

    expect(before.picks[1]).toBeNull();
    expect(after).not.toBe(before);
  });

  test.each([-1, 24, 999, 1.5])('ignores out of range pickNumber %p', (n) => {
    const before = fresh();
    const after = draftReducer(before, { type: 'setPick', pickNumber: n, playerId: id('x') });

    expect(after).toBe(before);
    expect(after.history).toHaveLength(0);
  });
});

describe('clearPick', () => {
  test('empties the slot', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 7, playerId: id('a') });
    state = draftReducer(state, { type: 'clearPick', pickNumber: 7 });

    expect(state.picks[7]).toBeNull();
  });

  test('clearing an already empty slot is a no-op and adds no history', () => {
    const before = fresh();
    const after = draftReducer(before, { type: 'clearPick', pickNumber: 7 });

    expect(after).toBe(before);
    expect(after.history).toHaveLength(0);
  });
});

describe('undo', () => {
  test('reverts the last setPick', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 0, playerId: id('a') });
    state = draftReducer(state, { type: 'setPick', pickNumber: 1, playerId: id('b') });
    state = draftReducer(state, { type: 'undo' });

    expect(state.picks[0]?.playerId).toBe('a');
    expect(state.picks[1]).toBeNull();
  });

  test('reverts an overwrite back to the original player', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 0, playerId: id('a') });
    state = draftReducer(state, { type: 'setPick', pickNumber: 0, playerId: id('b') });
    state = draftReducer(state, { type: 'undo' });

    expect(state.picks[0]?.playerId).toBe('a');
  });

  test('reverts a clearPick', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 2, playerId: id('a') });
    state = draftReducer(state, { type: 'clearPick', pickNumber: 2 });
    state = draftReducer(state, { type: 'undo' });

    expect(state.picks[2]?.playerId).toBe('a');
  });

  test('multiple undos walk back in order', () => {
    let state = fresh();
    state = draftReducer(state, { type: 'setPick', pickNumber: 0, playerId: id('a') });
    state = draftReducer(state, { type: 'setPick', pickNumber: 1, playerId: id('b') });
    state = draftReducer(state, { type: 'setPick', pickNumber: 2, playerId: id('c') });

    state = draftReducer(state, { type: 'undo' });
    state = draftReducer(state, { type: 'undo' });

    expect(state.picks[0]?.playerId).toBe('a');
    expect(state.picks[1]).toBeNull();
    expect(state.picks[2]).toBeNull();
    expect(state.history).toHaveLength(1);
  });

  test('undo on empty history is a no-op', () => {
    const before = fresh();
    const after = draftReducer(before, { type: 'undo' });

    expect(after).toBe(before);
  });

  test('history caps at 50 entries', () => {
    let state = fresh();
    for (let i = 0; i < 60; i++) {
      state = draftReducer(state, { type: 'setPick', pickNumber: 0, playerId: id(`p${i}`) });
    }

    expect(state.history).toHaveLength(50);
  });
});

describe('reset', () => {
  test('clears the board and history', () => {
    let state = draftReducer(fresh(), { type: 'setPick', pickNumber: 0, playerId: id('a') });
    state = draftReducer(state, { type: 'reset' });

    expect(state.picks.every((p) => p === null)).toBe(true);
    expect(state.history).toEqual([]);
  });
});
