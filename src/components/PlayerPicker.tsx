import { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Player, PlayerId } from '../types';
import type { DraftedBy } from '../draft/selectors';
import { normalizeName } from '../types';
import { POSITION_COLORS } from './positionColors';

const MAX_RESULTS = 8;

export type PlayerPickerHandle = {
  focus: () => void;
};

type PlayerPickerProps = {
  players: Player[];
  draftedBy: DraftedBy;
  targetSlot: number | null;
  autoFocus?: boolean;
  placeholder?: string;
  onSelect: (playerId: PlayerId, slot: number) => void;
  onCancel?: () => void;
};

export const PlayerPicker = forwardRef<PlayerPickerHandle, PlayerPickerProps>(
  function PlayerPicker(
    { players, draftedBy, targetSlot, autoFocus, placeholder, onSelect, onCancel },
    ref
  ) {
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const matches = useMemo(() => {
      const needle = normalizeName(query);
      if (needle.length === 0) return [];
      return players
        .filter((p) => p.searchName.includes(needle))
        .slice(0, MAX_RESULTS);
    }, [query, players]);

    /** Indices into `matches` that can actually be committed. */
    const selectable = useMemo(
      () => matches.map((p, i) => (draftedBy.has(p.id) ? -1 : i)).filter((i) => i >= 0),
      [matches, draftedBy]
    );

    // Whenever the result set changes, snap to the first selectable row.
    useEffect(() => {
      setHighlighted(selectable[0] ?? -1);
    }, [selectable]);

    function move(direction: 1 | -1) {
      if (selectable.length === 0) return;
      const position = selectable.indexOf(highlighted);
      const next = position === -1 ? 0 : position + direction;
      const clamped = Math.min(Math.max(next, 0), selectable.length - 1);
      setHighlighted(selectable[clamped] ?? -1);
    }

    function commit() {
      if (targetSlot === null) return;
      const player = matches[highlighted];
      if (player === undefined || draftedBy.has(player.id)) return;

      onSelect(player.id, targetSlot);
      setQuery('');
      setHighlighted(-1);
    }

    return (
      <div className="picker">
        <input
          ref={inputRef}
          type="text"
          className="picker__input"
          value={query}
          autoFocus={autoFocus}
          placeholder={placeholder ?? 'Search players…'}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                move(1);
                break;
              case 'ArrowUp':
                e.preventDefault();
                move(-1);
                break;
              case 'Enter':
                e.preventDefault();
                commit();
                break;
              case 'Escape':
                e.preventDefault();
                if (query.length > 0) setQuery('');
                else onCancel?.();
                break;
            }
          }}
        />

        {matches.length > 0 && (
          <ul className="picker__results">
            {matches.map((player, i) => {
              const taken = draftedBy.get(player.id);
              const isHighlighted = i === highlighted;

              return (
                <li
                  key={player.id}
                  className={[
                    'picker__row',
                    isHighlighted ? 'picker__row--active' : '',
                    taken ? 'picker__row--taken' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => { if (!taken) setHighlighted(i); }}
                  onClick={() => { if (!taken) { setHighlighted(i); commit(); } }}
                >
                  <span
                    className="picker__pos"
                    style={{ background: POSITION_COLORS[player.position] }}
                  >
                    {player.position}
                    {player.positionRank ?? ''}
                  </span>
                  <span className="picker__name">{player.name}</span>
                  <span className="picker__meta">
                    {player.team}
                    {player.byeWeek !== null && ` · bye ${player.byeWeek}`}
                  </span>
                  <span className="picker__rank">
                    {taken ? `→ ${taken.managerName}` : `#${player.rank}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);
