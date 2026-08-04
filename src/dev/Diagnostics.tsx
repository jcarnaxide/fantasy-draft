import csvText from '../data/FantasyPros_2026_Draft_ALL_Rankings.csv?raw';
import { parseRows } from '../parse';

export function Diagnostics() {
    const { players, errors } = parseRows(csvText);
    return (
        <div>
            <h2>Diagnostics</h2>
            <p>
                {players.length} players, {errors.length} errors
            </p>
            <ul>
                {errors.map((error, index) => (
                    <li key={index}>{error.reason}</li>
                ))}
            </ul>
        </div>
    );
}
