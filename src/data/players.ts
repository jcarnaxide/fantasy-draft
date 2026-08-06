import { parseRows } from '../parse';
import type { Player } from '../types';
import csvText from './FantasyPros_2026_Draft_ALL_Rankings.csv?raw';

export function getPlayers(): Player[] {
    return parseRows(csvText).players
}
