import Papa from 'papaparse';
import type { Player, PlayerId, Position, Team } from './types';
import { createPlayerId } from './types';

/** Full team names as they appear in the depth chart export. */
const TEAM_NAMES: Record<string, Team> = {
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL',
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Las Vegas Raiders': 'LV',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'Seattle Seahawks': 'SEA',
  'San Francisco 49ers': 'SF',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WAS',
};

/** Column group headers in the export. */
const POSITION_GROUPS: Record<string, Position> = {
  Quarterbacks: 'QB',
  'Running Backs': 'RB',
  'Wide Receivers': 'WR',
  'Tight Ends': 'TE',
};

export type DepthEntry = {
  playerId: PlayerId;
  name: string;
  team: Team;
  position: Position;
  depth: number;
};

export type DepthChartResult = {
  byPlayerId: Map<PlayerId, number>;
  entries: DepthEntry[];
  errors: string[];
};

/**
 * The export is 32 stacked blocks. Each block is a team-name row, a header row
 * naming four position groups, then rows holding one (ECR, name) pair per group.
 * A player's depth is his position within his column, so we count as we descend.
 */
export function parseDepthCharts(csvText: string): DepthChartResult {
  const { data } = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: 'greedy',
  });

  const byPlayerId = new Map<PlayerId, number>();
  const entries: DepthEntry[] = [];
  const errors: string[] = [];

  let team: Team | null = null;
  /** Maps a name-column index to the position it holds, from the current header row. */
  let columnPositions = new Map<number, Position>();
  let depthCounters = new Map<Position, number>();

  data.forEach((row, i) => {
    const line = i + 1;
    const cells = row.map((c) => c.trim());

    // A lone non-empty cell starts a new team block.
    if (cells.length === 1) {
      const label = cells[0] ?? '';
      if (label === '') return;

      const abbreviation = TEAM_NAMES[label];
      if (abbreviation === undefined) {
        errors.push(`line ${line}: unrecognized team "${label}"`);
        team = null;
        return;
      }

      team = abbreviation;
      columnPositions = new Map();
      depthCounters = new Map();
      return;
    }

    // A header row tells us which column holds which position.
    if (cells.some((c) => c in POSITION_GROUPS)) {
      columnPositions = new Map();
      cells.forEach((cell, index) => {
        const position = POSITION_GROUPS[cell];
        if (position !== undefined) columnPositions.set(index, position);
      });
      return;
    }

    // Everything else is a data row.
    if (team === null) {
      errors.push(`line ${line}: data row before any team header`);
      return;
    }

    for (const [index, position] of columnPositions) {
      const name = cells[index] ?? '';
      if (name === '') continue;

      const depth = (depthCounters.get(position) ?? 0) + 1;
      depthCounters.set(position, depth);

      const playerId = createPlayerId(name, team, position);

      if (byPlayerId.has(playerId)) {
        errors.push(`line ${line}: duplicate depth entry for "${name}" (${team} ${position})`);
        continue;
      }

      byPlayerId.set(playerId, depth);
      entries.push({ playerId, name, team, position, depth });
    }
  });

  return { byPlayerId, entries, errors };
}

/** Returns a new pool with depth attached where it could be matched. */
export function withDepthCharts(
  players: Player[],
  byPlayerId: Map<PlayerId, number>
): Player[] {
  return players.map((player) => {
    const depth = byPlayerId.get(player.id);
    return depth === undefined ? player : { ...player, depthChartRank: depth };
  });
}

export type DepthJoinReport = {
  matched: number;
  /** Depth entries with no corresponding ranked player — usually deep bench. */
  unmatchedEntries: DepthEntry[];
  /** Ranked skill-position players we found no depth for. These are the concerning ones. */
  rankedWithoutDepth: Player[];
};

export function reportDepthJoin(players: Player[], result: DepthChartResult): DepthJoinReport {
  const playerIds = new Set(players.map((p) => p.id));
  const skillPositions = new Set<Position>(['QB', 'RB', 'WR', 'TE']);

  return {
    matched: result.entries.filter((e) => playerIds.has(e.playerId)).length,
    unmatchedEntries: result.entries.filter((e) => !playerIds.has(e.playerId)),
    rankedWithoutDepth: players.filter(
      (p) => skillPositions.has(p.position) && !result.byPlayerId.has(p.id)
    ),
  };
}
