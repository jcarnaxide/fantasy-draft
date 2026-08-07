import type { Player, PlayerId, Pick, DraftSettings } from '../types';
import { toPickNumber } from '../draft/snake';
import { PickCell } from './PickCell';

type DraftBoardProps = {
  picks: (Pick | null)[];
  settings: DraftSettings;
  playersById: Map<PlayerId, Player>;
  currentSlot: number | null;
  onCellClick: (pickNumber: number) => void;
};

export function DraftBoard({
  picks,
  settings,
  playersById,
  currentSlot,
  onCellClick,
}: DraftBoardProps) {
  const managerCount = settings.managers.length;

  return (
    <div className="draft-board">
      <table>
        <thead>
          <tr>
            <th className="draft-board__round-label" />
            {settings.managers.map((manager) => (
              <th
                key={manager.id}
                className={
                  manager.id === settings.myManagerId
                    ? 'draft-board__manager draft-board__manager--mine'
                    : 'draft-board__manager'
                }
              >
                {manager.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: settings.rounds }, (_, round) => {
            const reversed = round % 2 === 1;
            return (
              <tr key={round} className={reversed ? 'draft-board__row--reversed' : undefined}>
                <th className="draft-board__round-label">
                  {round + 1} {reversed ? '←' : '→'}
                </th>
                {settings.managers.map((manager, managerIndex) => {
                  const slot = toPickNumber(round, managerIndex, managerCount);
                  const pick = picks[slot] ?? null;
                  return (
                    <PickCell
                      key={manager.id}
                      pickNumber={slot}
                      pick={pick}
                      player={pick ? playersById.get(pick.playerId) : undefined}
                      isCurrent={slot === currentSlot}
                      onClick={onCellClick}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
