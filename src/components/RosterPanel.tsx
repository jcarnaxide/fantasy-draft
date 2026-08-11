import { useMemo } from 'react';
import type { Position } from '../types';
import { POSITIONS } from '../types';
import type { RosteredPlayer } from '../draft/selectors';
import { POSITION_COLORS } from './positionColors';

/** Starting-lineup requirements for our league. */
const STARTERS: Record<Position, number> = {
  QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1,
};

/** Shown as a simple drafted/not checkbox to save space. */
const CHECKED: readonly Position[] = ['K', 'DST'];

type RosterPanelProps = {
  roster: RosteredPlayer[];
};

export function RosterPanel({ roster }: RosterPanelProps) {
  // Group my players by position, best rank first within each.
  const byPosition = useMemo(() => {
    const map = new Map<Position, RosteredPlayer[]>(POSITIONS.map((pos) => [pos, []]));
    for (const entry of roster) {
      map.get(entry.player.position)?.push(entry);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.player.rank - b.player.rank);
    }
    return map;
  }, [roster]);

  return (
    <aside className="roster">
      <h2 className="roster__title">My Roster</h2>

      <div className="roster__columns">
        {[['QB', 'RB'], ['WR', 'TE']].map((pair) => (
          <div key={pair.join()} className="roster__col">
            {(pair as Position[]).map((position) => (
              <RosterGroup
                key={position}
                position={position}
                entries={byPosition.get(position) ?? []}
                required={STARTERS[position]}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="roster__checks">
        {CHECKED.map((position) => {
          const filled = (byPosition.get(position)?.length ?? 0) > 0;
          return (
            <label key={position} className="roster__check">
              <input type="checkbox" checked={filled} readOnly />
              <span
                className="roster__check-pos"
                style={{ background: POSITION_COLORS[position] }}
              >
                {position}
              </span>
            </label>
          );
        })}
      </div>
    </aside>
  );
}

type RosterGroupProps = {
  position: Position;
  entries: RosteredPlayer[];
  required: number;
};

function RosterGroup({ position, entries, required }: RosterGroupProps) {
  // Always render the required starter slots (empty ones as placeholders),
  // then any bench overflow.
  const rowCount = Math.max(required, entries.length);

  return (
    <div className="roster__group">
      <div
        className="roster__group-header"
        style={{ background: POSITION_COLORS[position] }}
      >
        <span>{position}</span>
        <span className="roster__group-count">
          {entries.length}/{required}
        </span>
      </div>

      {Array.from({ length: rowCount }, (_, i) => {
        const entry = entries[i];
        const isStarter = i < required;
        const className = [
          'roster__row',
          isStarter ? 'roster__row--starter' : 'roster__row--bench',
          entry ? '' : 'roster__row--empty',
        ].filter(Boolean).join(' ');

        return (
          <div key={i} className={className}>
            {entry ? (
              <>
                <span className="roster__name" title={entry.player.name}>
                  {entry.player.name}
                </span>
                <span className="roster__rank">{entry.player.rank}</span>
              </>
            ) : (
              <span className="roster__empty-label">empty</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
