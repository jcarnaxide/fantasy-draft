import { countByPosition, findDuplicateIds } from '../analyze';
import csvText from '../data/FantasyPros_2026_Draft_ALL_Rankings.csv?raw';
import { DataTable, type Column } from '../DataTable';
import { parseRows } from '../parse';
import { POSITIONS, type Player } from '../types';

const playerColumns: Column<Player>[] = [
    { header: 'RK',    render: (p) => p.rank },
    { header: 'Tier',  render: (p) => p.tier ?? '—' },
    { header: 'Name',  render: (p) => p.name },
    { header: 'Pos',   render: (p) => p.position },
    { header: 'PosRk', render: (p) => p.positionRank ?? '—' },
    { header: 'Team',  render: (p) => p.team },
    { header: 'Bye',   render: (p) => p.byeWeek ?? '—' },
    { header: 'Search', render: (p) => <code>{p.searchName}</code> },
    { header: 'ID',    render: (p) => <code>{p.id}</code> },
];

export function Diagnostics() {
    const { players, errors } = parseRows(csvText);
    const counts = countByPosition(players);
    const duplicates = findDuplicateIds(players);
    return (
        <div>
            <h2>Diagnostics</h2>
            <h3>Total Player count and parsing errors</h3>
            <p>
                {players.length} players, {errors.length} errors
            </p>
            <ul>
                {errors.map((error, index) => (
                    <li key={index}>{error.reason}</li>
                ))}
            </ul>
            <h3>Position Counts</h3>
            <ul>
                {(POSITIONS.map((pos) => (
                    <li key={pos}>{pos}: {counts[pos]}</li>
                )))}
            </ul>
            <h3>Found duplicate player id's</h3>
            <p>{duplicates.length} duplicates</p>
            <ul>
                {duplicates.map((playerId) => (
                    <li key={playerId}>{playerId}</li>
                ))}
            </ul>
            <h3>Sample Table</h3>
            <DataTable
                items={players.slice(0, 20)}
                columns={playerColumns}
                getKey={(p) => p.id}
            />
        </div>
    );
}
