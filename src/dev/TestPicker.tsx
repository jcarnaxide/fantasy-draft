import { useState } from "react"
import { normalizeName, type Player } from "../types";
import { getPlayers } from "../data/players";

const DISPLAY_RESULT_COUNT = 8;

export function TestPicker() {
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const [picked, setPicked] = useState<Player[]>([]);

    const players = getPlayers();
    const matches = query.trim()
        ? players.filter((p) => p.searchName.includes(normalizeName(query))).slice(0, DISPLAY_RESULT_COUNT)
        : [];

    return (
        <div>
            <h1>Test Picker</h1>
            <button type="button" onClick={() => setPicked([])}>
                Clear List
            </button>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        setQuery('');
                        setHighlighted(0);
                        const match = matches[highlighted];
                        if (match !== undefined) {
                            setPicked((prev) => [...prev, match]);
                        }
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlighted((p) => Math.min(p+1, matches.length-1));
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlighted((p) => Math.max(p-1,0));
                    } else if (e.key === 'Escape') {
                        setQuery('');
                        setHighlighted(0);
                    }
                }}
                placeholder="Search players…"
                autoFocus
            />
            <ul>
                {matches.map((p, i) => (
                    <li key={p.id} className={i === highlighted ? 'row row-active' : 'row'}>
                        {p.name}
                    </li>
                ))}
            </ul>
            <ul>
                {picked.map((p) => (
                    <li key={p.id}>{p.name}</li>
                ))}
            </ul>
        </div>
    )
}
