export const TEAMS = ['FA', 'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'] as const;
export type Team = typeof TEAMS[number];

export const POSITIONS = ['QB','RB','WR','TE','K','DST'] as const;
export type Position = typeof POSITIONS[number];

export type PlayerId = string & { readonly __brand: 'PlayerId' };

export type Player = {
  id: PlayerId;
  name: string;         // display: "Ja'Marr Chase"
  searchName: string;   // normalized, precomputed: "jamarr chase"
  rank: number;         // overall ECR
  tier: number | null;
  position: Position;
  positionRank: number | null;
  team: Team;
  byeWeek: number | null;
  depthChartRank: number | null;   // 1 = starter at his position
};

export type RawCsvRow = Partial<{
  RK: string;
  TIERS: string;
  'PLAYER NAME': string;
  TEAM: string;
  POS: string;
  'BYE WEEK': string;
}>;

export type ParseError = {
  row: number;          // 1-based, matches what a spreadsheet would show
  raw: RawCsvRow;
  reason: string;
};

export type Manager = {
  id: string;
  name: string;
}

export type DraftSettings = {
  rounds: number;
  managers: Manager[];   // index = draft slot, order matters
  myManagerId: string;   // which one is you, for defaults in the roster view
};

export type Pick = {
  playerId: PlayerId;
  timestamp: number;
}

export type DraftState = {
  settings: DraftSettings;
  picks: (Pick | null)[];
  history: (Pick | null)[][];
};

export type Action =
  | { type: 'setPick'; pickNumber: number; playerId: PlayerId; isKeeper?: boolean; pickedAt?: number }
  | { type: 'clearPick'; pickNumber: number }
  | { type: 'undo' }
  | { type: 'reset' };

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')                 // split accented chars into base + accent
    .replace(/[\u0300-\u036f]/g, '')  // drop the accents
    .replace(/[.'`’]/g, '')           // A.J. -> aj, Ja'Marr -> jamarr
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The only sanctioned `as PlayerId` in the codebase. */
export function createPlayerId(name: string, team: Team, position: Position): PlayerId {
  return `${normalizeName(name).replace(/ /g, '-')}-${team}-${position}` as PlayerId;
}
