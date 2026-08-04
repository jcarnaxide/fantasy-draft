import Papa from 'papaparse';
import type { RawCsvRow, Player, ParseError, Position, Team } from './types';
import { POSITIONS, TEAMS, createPlayerId, normalizeName } from './types';

const TEAM_ALIASES: Record<string, Team> = {
  JAC: 'JAX',
  WSH: 'WAS',
  LVR: 'LV',
  OAK: 'LV',
  LA: 'LAR',
  SD: 'LAC',
  STL: 'LAR',
};

function isPosition(s: string): s is Position {
  return (POSITIONS as readonly string[]).includes(s);
}

function isTeam(s: string): s is Team {
  return (TEAMS as readonly string[]).includes(s);
}

function toTeam(raw: string | undefined): Team | null {
  const t = (raw ?? '').trim().toUpperCase();
  if (!t) return null;
  const canon = TEAM_ALIASES[t] ?? t;
  return isTeam(canon) ? canon : null;
}

/** "WR1" -> { position: 'WR', positionRank: 1 }; "DST" -> rank null */
function splitPos(raw: string | undefined): { position: Position; positionRank: number | null } | null {
  const match = (raw ?? '').trim().toUpperCase().match(/^([A-Z/]+)(\d+)?$/);
  if (!match) return null;

  const [, posPart, rankPart] = match;
  const pos = posPart === 'D/ST' || posPart === 'DEF' ? 'DST' : posPart;
  if (!pos || !isPosition(pos)) return null;

  return {
    position: pos,
    positionRank: rankPart ? Number(rankPart) : null,
  };
}

function toInt(raw: string | undefined): number | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseRow(row: RawCsvRow): Player | string {
  const name = (row['PLAYER NAME'] ?? '').trim();
  if (!name) return 'missing player name';

  const rank = toInt(row.RK);
  if (rank === null) return `bad rank: "${row.RK ?? ''}"`;

  const pos = splitPos(row.POS);
  if (!pos) return `unrecognized position: "${row.POS ?? ''}"`;

  const team = toTeam(row.TEAM);
  if (!team) return `unrecognized team: "${row.TEAM ?? ''}"`;

  return {
    id: createPlayerId(name, team, pos.position),
    name,
    searchName: normalizeName(name),
    rank,
    tier: toInt(row.TIERS),
    position: pos.position,
    positionRank: pos.positionRank,
    team,
    byeWeek: toInt(row['BYE WEEK']),
  };
}

export type ParseResult = {
  players: Player[];
  errors: ParseError[];
};

export function parseRows(csvString: string): ParseResult {
  const { data, errors: papaErrors } = Papa.parse<RawCsvRow>(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toUpperCase(),
  });

  const players: Player[] = [];
  const errors: ParseError[] = papaErrors.map((e) => ({
    row: (e.row ?? -1) + 2,
    raw: {},
    reason: e.message,
  }));

  data.forEach((row, i) => {
    const result = parseRow(row);
    if (typeof result === 'string') {
      errors.push({ row: i + 2, raw: row, reason: result });
    } else {
      players.push(result);
    }
  });

  players.sort((a, b) => a.rank - b.rank);
  return { players, errors };
}
