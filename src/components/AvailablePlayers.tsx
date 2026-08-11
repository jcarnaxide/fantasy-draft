import { useMemo, useState } from 'react';
import type { Player, Position, PlayerId } from '../types';
import { POSITIONS } from '../types';
import { POSITION_COLORS } from './positionColors';

const PRIMARY: readonly Position[] = ['QB', 'RB', 'WR', 'TE'];
const SECONDARY: readonly Position[] = ['K', 'DST'];
const DEFAULT_LIMIT = 12;

type AvailablePlayersProps = {
  available: Player[];
  onPick: (playerId: PlayerId) => void;
  canPick: boolean;
};

/** A run of players sharing a tier, in rank order. */
type TierGroup = {
  tier: number | null;
  players: Player[];
};

/** Depth-chart rank as a color-coded badge: starter (1), backup (2), deeper (3+). */
function DepthBadge({ player }: { player: Player }) {
  const depth = player.depthChartRank;
  if (depth === null) return <span className="row__depth" />;

  const tier = depth === 1 ? 'starter' : depth === 2 ? 'backup' : 'deep';
  const role = depth === 1 ? 'starter' : depth === 2 ? 'backup' : `#${depth} on depth chart`;

  return (
    <span
      className={`row__depth row__depth--${tier}`}
      title={`${player.team} ${player.position} depth: ${role}`}
    >
      {depth}
    </span>
  );
}

/** Assumes `players` is already sorted by overall rank. */
function groupByTier(players: Player[]): TierGroup[] {
  const groups: TierGroup[] = [];

  for (const player of players) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.tier === player.tier) {
      last.players.push(player);
    } else {
      groups.push({ tier: player.tier, players: [player] });
    }
  }

  return groups;
}

export function AvailablePlayers({ available, onPick, canPick }: AvailablePlayersProps) {
  const [showSecondary, setShowSecondary] = useState(false);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const byPosition = useMemo(() => {
    const map = new Map<Position, Player[]>(POSITIONS.map((pos) => [pos, []]));
    for (const player of available) {
      map.get(player.position)?.push(player);
    }
    return map;
  }, [available]);

  const columns = showSecondary ? [...PRIMARY, ...SECONDARY] : PRIMARY;

  return (
    <section className="available">
      <div className="available__toolbar">
        <label>
          <input
            type="checkbox"
            checked={showSecondary}
            onChange={(e) => setShowSecondary(e.target.checked)}
          />
          Show K / DST
        </label>
        <label>
          Depth
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={20}>20</option>
            <option value={9999}>All</option>
          </select>
        </label>
      </div>

      <div className="available__columns">
        {columns.map((position) => (
          <PositionColumn
            key={position}
            position={position}
            players={byPosition.get(position) ?? []}
            limit={limit}
            onPick={onPick}
            canPick={canPick}
          />
        ))}
      </div>
    </section>
  );
}

type PositionColumnProps = {
  position: Position;
  players: Player[];
  limit: number;
  onPick: (playerId: PlayerId) => void;
  canPick: boolean;
};

function PositionColumn({ position, players, limit, onPick, canPick }: PositionColumnProps) {
  const visible = players.slice(0, limit);
  const groups = useMemo(() => groupByTier(visible), [visible]);

  return (
    <div className="column">
      <header
        className="column__header"
        style={{ background: POSITION_COLORS[position] }}
      >
        {position}
        <span className="column__count">{players.length}</span>
      </header>

      <div className="column__legend">
        <span>Player</span>
        <span className="column__legend-num">Dep</span>
        <span className="column__legend-num">Pos</span>
        <span className="column__legend-num">Ovr</span>
      </div>

      <div className="column__body">
        {groups.map((group, i) => (
          <div key={`${group.tier ?? 'none'}-${i}`} className="tier">
            <div className="tier__label">
              {group.tier === null ? 'Unranked' : `Tier ${group.tier}`}
            </div>
            {group.players.map((player) => (
              <button
                type="button"
                key={player.id}
                className="row"
                disabled={!canPick}
                onClick={() => onPick(player.id)}
                title={`${player.name} · ${player.team}${player.byeWeek !== null ? ` · bye ${player.byeWeek}` : ''}`}
              >
                <span className="row__name">{player.name}</span>
                <DepthBadge player={player} />
                <span className="row__posrank">
                  {player.positionRank ?? '—'}
                </span>
                <span className="row__rank">{player.rank}</span>
              </button>
            ))}
          </div>
        ))}

        {players.length > visible.length && (
          <div className="column__more">+{players.length - visible.length} more</div>
        )}
      </div>
    </div>
  );
}
