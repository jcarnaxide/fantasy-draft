import type {Player, PlayerId, Position} from './types';
import { POSITIONS } from './types';

export function countByPosition(players: Player[]): Record<Position, number> {
    const counts = Object.fromEntries(
        POSITIONS.map((pos) => [pos, 0])
    ) as Record<Position, number>;
    players.forEach((player) => {
        counts[player.position] += 1
    })
    return counts;
}

export function findDuplicateIds(players: Player[]): PlayerId[] {
    const result: PlayerId[] = [];
    const existing = new Set<PlayerId>();
    players.forEach((player) => {
        if (existing.has(player.id)) {
            result.push(player.id);
        }
        existing.add(player.id);
    })
    return result;
}