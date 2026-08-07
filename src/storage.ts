import type { DraftState, Player } from './types';
import { parseRows } from './parse';

const DRAFT_KEY = 'draft-v1';
const POOL_KEY = 'pool-v1';
const POOL_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEPTH_KEY = 'depth-v1';
const DEPTH_TTL_MS = 24 * 60 * 60 * 1000; // depth charts move far slower than rankings

/** DraftState minus history, which is intentionally not persisted. */
type PersistedDraft = Omit<DraftState, 'history'>;

type PersistedPool = {
  csvText: string;
  fetchedAt: number;
  source: 'csv' | 'api';
};

export type PoolResult = {
  players: Player[];
  fetchedAt: number;
  isStale: boolean;
  source: 'csv' | 'api';
};

// --- draft ---------------------------------------------------------------

export function saveDraft(state: DraftState): void {
  const { history, ...persisted } = state;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(persisted));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export function loadDraft(): DraftState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('Stored draft was not valid JSON, ignoring it.');
    return null;
  }

  if (!isPersistedDraft(parsed)) {
    console.error('Stored draft did not match the expected shape, ignoring it.');
    return null;
  }

  return { ...parsed, history: [] };
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing useful to do */
  }
}

function isPersistedDraft(value: unknown): value is PersistedDraft {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  if (!Array.isArray(v.picks)) return false;
  if (typeof v.settings !== 'object' || v.settings === null) return false;

  const s = v.settings as Record<string, unknown>;
  if (typeof s.rounds !== 'number') return false;
  if (!Array.isArray(s.managers)) return false;
  if (v.picks.length !== s.rounds * s.managers.length) return false;

  return true;
}

// --- player pool ---------------------------------------------------------

export function savePlayerPool(csvText: string, source: 'csv' | 'api' = 'csv'): void {
  const payload: PersistedPool = { csvText, fetchedAt: Date.now(), source };
  try {
    localStorage.setItem(POOL_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to cache player pool:', err);
  }
}

/**
 * Returns the cached pool if present. `isStale` is advisory — callers decide
 * whether to refetch. Stale data beats no data during a live draft.
 */
export function loadPlayerPool(): PoolResult | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(POOL_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isPersistedPool(parsed)) return null;

  const { players, errors } = parseRows(parsed.csvText);
  if (errors.length > 0) {
    console.warn(`Cached pool parsed with ${errors.length} row error(s).`);
  }
  if (players.length === 0) return null;

  return {
    players,
    fetchedAt: parsed.fetchedAt,
    isStale: Date.now() - parsed.fetchedAt > POOL_TTL_MS,
    source: parsed.source,
  };
}

function isPersistedPool(value: unknown): value is PersistedPool {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.csvText === 'string' &&
    typeof v.fetchedAt === 'number' &&
    (v.source === 'csv' || v.source === 'api')
  );
}

// --- integrity -----------------------------------------------------------

/** Slot numbers whose stored player no longer exists in the current pool. */
export function findOrphanedPicks(state: DraftState, players: Player[]): number[] {
  const known = new Set(players.map((p) => p.id));
  const orphans: number[] = [];

  state.picks.forEach((pick, slot) => {
    if (pick !== null && !known.has(pick.playerId)) orphans.push(slot);
  });

  return orphans;
}
