import type { Player, Pick, PlayerId, DraftSettings } from '../types';
import { toSlot } from './snake';

export type DraftedBy = Map<PlayerId, { managerName: string; pickNumber: number }>;

/** Who took each drafted player. One pass over the board. */
export function getDraftedBy(picks: (Pick | null)[], settings: DraftSettings): DraftedBy {
  const map: DraftedBy = new Map();
  const managerCount = settings.managers.length;

  picks.forEach((pick, pickNumber) => {
    if (pick === null) return;
    const { managerIndex } = toSlot(pickNumber, managerCount);
    const manager = settings.managers[managerIndex];
    map.set(pick.playerId, {
      managerName: manager?.name ?? '?',
      pickNumber,
    });
  });

  return map;
}

export function getAvailablePlayers(players: Player[], drafted: DraftedBy): Player[] {
  return players.filter((p) => !drafted.has(p.id));
}
