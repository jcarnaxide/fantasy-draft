import { countByPosition, findDuplicateIds } from '../analyze';
import csvText from '../data/FantasyPros_2026_Draft_ALL_Rankings.csv?raw';
import { parseRows } from '../parse';
import { POSITIONS } from '../types';

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
        </div>
    );
}
