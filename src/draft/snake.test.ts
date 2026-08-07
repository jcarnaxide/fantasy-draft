import { describe, expect, test } from 'vitest';
import { toSlot, toPickNumber, getCurrentSlot } from './snake';
import type { Pick } from '../types';

const N = 12; // managers

describe('toSlot', () => {
  test('round 0 runs left to right', () => {
    expect(toSlot(0, N)).toEqual({ round: 0, managerIndex: 0 });
    expect(toSlot(5, N)).toEqual({ round: 0, managerIndex: 5 });
    expect(toSlot(11, N)).toEqual({ round: 0, managerIndex: 11 });
  });

  test('round 1 reverses', () => {
    expect(toSlot(12, N)).toEqual({ round: 1, managerIndex: 11 });
    expect(toSlot(17, N)).toEqual({ round: 1, managerIndex: 6 });
    expect(toSlot(23, N)).toEqual({ round: 1, managerIndex: 0 });
  });

  test('round 2 runs left to right again', () => {
    expect(toSlot(24, N)).toEqual({ round: 2, managerIndex: 0 });
    expect(toSlot(35, N)).toEqual({ round: 2, managerIndex: 11 });
  });

  test('turn boundaries: back-to-back picks for the same manager', () => {
    // manager 11 picks at the end of round 0 and start of round 1
    expect(toSlot(11, N).managerIndex).toBe(toSlot(12, N).managerIndex);
    // manager 0 picks at the end of round 1 and start of round 2
    expect(toSlot(23, N).managerIndex).toBe(toSlot(24, N).managerIndex);
  });
});

describe('toPickNumber', () => {
  test('matches known slots', () => {
    expect(toPickNumber(0, 0, N)).toBe(0);
    expect(toPickNumber(0, 11, N)).toBe(11);
    expect(toPickNumber(1, 11, N)).toBe(12);
    expect(toPickNumber(1, 0, N)).toBe(23);
    expect(toPickNumber(2, 0, N)).toBe(24);
  });
});

describe('roundtrip', () => {
  test('toPickNumber undoes toSlot for every slot on a 16 round board', () => {
    for (let n = 0; n < N * 16; n++) {
      const { round, managerIndex } = toSlot(n, N);
      expect(toPickNumber(round, managerIndex, N)).toBe(n);
    }
  });

  test('holds for an odd manager count', () => {
    const odd = 11;
    for (let n = 0; n < odd * 5; n++) {
      const { round, managerIndex } = toSlot(n, odd);
      expect(toPickNumber(round, managerIndex, odd)).toBe(n);
    }
  });
});

describe('getCurrentSlot', () => {
  const board = (filled: number[], size = N * 16): (Pick | null)[] =>
    Array.from({ length: size }, (_, i) =>
      filled.includes(i)
        ? { playerId: `p${i}` as Pick['playerId'], timestamp: 0 }
        : null
    );

  test('empty board starts at 0', () => {
    expect(getCurrentSlot(board([]))).toBe(0);
  });

  test('skips consecutive filled slots', () => {
    expect(getCurrentSlot(board([0, 1, 2]))).toBe(3);
  });

  test('finds the first hole even when later slots are filled by keepers', () => {
    expect(getCurrentSlot(board([0, 1, 5, 20]))).toBe(2);
  });

  test('returns null when the board is full', () => {
    const size = N * 2;
    const all = Array.from({ length: size }, (_, i) => i);
    expect(getCurrentSlot(board(all, size))).toBeNull();
  });
});
