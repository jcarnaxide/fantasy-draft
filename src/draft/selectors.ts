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

export type RosteredPlayer = { player: Player; pickNumber: number };

/** Players drafted by one manager, in board order. Orphaned picks are skipped. */
export function getManagerRoster(
  picks: (Pick | null)[],
  settings: DraftSettings,
  managerId: string,
  playersById: Map<PlayerId, Player>,
): RosteredPlayer[] {
  const managerCount = settings.managers.length;
  const out: RosteredPlayer[] = [];

  picks.forEach((pick, pickNumber) => {
    if (pick === null) return;
    const { managerIndex } = toSlot(pickNumber, managerCount);
    if (settings.managers[managerIndex]?.id !== managerId) return;
    const player = playersById.get(pick.playerId);
    if (player === undefined) return;
    out.push({ player, pickNumber });
  });

  return out;
}
