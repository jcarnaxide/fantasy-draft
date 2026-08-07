import type { Position } from '../types';

/** Background per position. Tuned for dark text legibility at small sizes. */
export const POSITION_COLORS: Record<Position, string> = {
  QB: '#fca5a5', // red
  RB: '#86efac', // green
  WR: '#93c5fd', // blue
  TE: '#fdba74', // orange
  K:  '#d8b4fe', // purple
  DST:'#cbd5e1', // slate
};
