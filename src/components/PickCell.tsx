import type { Player, Pick, PlayerId } from '../types';
import { POSITION_COLORS } from './positionColors';

type PickCellProps = {
  pickNumber: number;
  pick: Pick | null;
  player: Player | undefined;
  isCurrent: boolean;
  onClick: (pickNumber: number) => void;
};

/** "Ja'Marr Chase" -> "Chase". Defenses keep their full name. */
function shortName(player: Player): string {
  if (player.position === 'DST') return player.name;
  const parts = player.name.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : player.name;
}

export function PickCell({ pickNumber, pick, player, isCurrent, onClick }: PickCellProps) {
  const background = player ? POSITION_COLORS[player.position] : 'transparent';

  const classNames = ['pick-cell'];
  if (isCurrent) classNames.push('pick-cell--current');
  if (pick && !player) classNames.push('pick-cell--orphaned');

  return (
    <td
      className={classNames.join(' ')}
      style={{ background }}
      onClick={() => onClick(pickNumber)}
      title={player ? `${player.name} · ${player.position} · ${player.team}` : `Pick ${pickNumber + 1}`}
    >
      {pick === null ? (
        <span className="pick-cell__number">{pickNumber + 1}</span>
      ) : player ? (
        <span className="pick-cell__name">{shortName(player)}</span>
      ) : (
        <span className="pick-cell__name">unknown</span>
      )}
    </td>
  );
}
