import csvText from './data/FantasyPros_2026_Draft_ALL_Rankings.csv?raw';
import depthCsvText from './data/FantasyPros_Fantasy_Football_2026_Depth_Charts.csv?raw';

import { useReducer, useEffect, useState, useMemo, useRef } from 'react';
import { draftReducer, createInitialState } from './draft/state';
import { getCurrentSlot } from './draft/snake';
import { getAvailablePlayers, getDraftedBy, getManagerRoster } from './draft/selectors';
import { loadDraft, saveDraft, loadPlayerPool, savePlayerPool, findOrphanedPicks } from './storage';
import { DraftBoard } from './components/DraftBoard';
import { PlayerPicker, type PlayerPickerHandle } from './components/PlayerPicker';
import type { Player, PlayerId, DraftSettings } from './types';
import './App.css';
import { parseDepthCharts, withDepthCharts } from './parseDepthCharts';
import { AvailablePlayers } from './components/AvailablePlayers';
import { RosterPanel } from './components/RosterPanel';

const defaultSettings: DraftSettings = { 
  rounds: 16,
  managers: [
    { id: "Sasquatch", name: "Sasquatch"},
    { id: "Justin", name: "Justin"},
    { id: "Matt", name: "Matt"},
    { id: "Fish", name: "Fish"},
    { id: "Tom", name: "Tom"},
    { id: "Pat", name: "Pat"},
    { id: "CJ", name: "CJ"},
    { id: "Mark", name: "Mark"},
    { id: "JesseC", name: "JesseC"},
    { id: "Wally", name: "Wally"},
    { id: "Aaron", name: "Aaron"},
    { id: "Julian", name: "Julian"},
  ],
  myManagerId: "JesseC",
};

export default function App() {
  const [draft, dispatch] = useReducer(
    draftReducer,
    undefined,
    () => loadDraft() ?? createInitialState(defaultSettings)
  );

  const [players, setPlayers] = useState<Player[]>([]);
  const [poolFetchedAt, setPoolFetchedAt] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingKeeper, setEditingKeeper] = useState(false);

  const mainPickerRef = useRef<PlayerPickerHandle>(null);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    const cached = loadPlayerPool();
    if (cached && !cached.isStale) {
      setPlayers(cached.players);
      setPoolFetchedAt(cached.fetchedAt);
      return;
    }
    savePlayerPool(csvText, 'csv');
    const fresh = loadPlayerPool();
    setPlayers(fresh?.players ?? []);
    setPoolFetchedAt(fresh?.fetchedAt ?? null);
  }, []);
  const enriched = useMemo(() => {
    const depth = parseDepthCharts(depthCsvText);
    return withDepthCharts(players, depth.byPlayerId);
  }, [players]);

  // Typing anywhere reclaims focus for the main picker, unless a cell is being edited.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (editingSlot !== null) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;

      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      mainPickerRef.current?.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingSlot]);

  const playersById = useMemo(
    () => new Map(enriched.map((p) => [p.id, p])),
    [enriched]
  );

  const draftedBy = useMemo(
    () => getDraftedBy(draft.picks, draft.settings),
    [draft.picks, draft.settings]
  );

  const myRoster = useMemo(
    () => getManagerRoster(draft.picks, draft.settings, draft.settings.myManagerId, playersById),
    [draft.picks, draft.settings, playersById]
  );

  const currentSlot = getCurrentSlot(draft.picks);

  const orphans = useMemo(
    () => (enriched.length > 0 ? findOrphanedPicks(draft, enriched) : []),
    [draft, enriched]
  );

  const poolAgeMinutes =
    poolFetchedAt === null ? null : Math.floor((Date.now() - poolFetchedAt) / 60000);

  const available = useMemo(
    () => getAvailablePlayers(players, draftedBy),
    [players, draftedBy]
  );

  function handleSelect(playerId: PlayerId, slot: number, isKeeper = false) {
    dispatch({ type: 'setPick', pickNumber: slot, playerId, isKeeper });
  }

  function openEditor(slot: number) {
    setEditingKeeper(draft.picks[slot]?.isKeeper ?? false);
    setEditingSlot(slot);
  }

  function closeEditor() {
    setEditingSlot(null);
    mainPickerRef.current?.focus();
  }

  function handleEditorSelect(playerId: PlayerId, slot: number) {
    handleSelect(playerId, slot, editingKeeper);
    closeEditor();
  }

  // Toggle the keeper flag. If the slot already holds a player, re-apply it
  // immediately (preserving the timestamp) so the star updates without a re-pick.
  function handleKeeperToggle(checked: boolean) {
    setEditingKeeper(checked);
    if (editingSlot === null) return;
    const existing = draft.picks[editingSlot];
    if (existing) {
      dispatch({
        type: 'setPick',
        pickNumber: editingSlot,
        playerId: existing.playerId,
        isKeeper: checked,
        pickedAt: existing.timestamp,
      });
    }
  }

  const editingLabel =
    editingSlot === null
      ? null
      : draft.picks[editingSlot] === null
        ? `Set pick ${editingSlot + 1}`
        : `Replace pick ${editingSlot + 1}`;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Draft Board</h1>
        <div className="app__status">
          <span>{enriched.length} players</span>
          {poolAgeMinutes !== null && <span>loaded {poolAgeMinutes}m ago</span>}
          <span>
            {currentSlot === null ? 'draft complete' : `on the clock: pick ${currentSlot + 1}`}
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={draft.history.length === 0}
          >
            Undo
          </button>
        </div>

        <div className="app__picker">
          <PlayerPicker
            ref={mainPickerRef}
            players={enriched}
            draftedBy={draftedBy}
            targetSlot={currentSlot}
            autoFocus
            placeholder={
              currentSlot === null
                ? 'Draft complete'
                : `Pick ${currentSlot + 1}…`
            }
            onSelect={handleSelect}
          />
        </div>
      </header>

      {orphans.length > 0 && (
        <div className="app__warning">
          {orphans.length} pick(s) reference players missing from the current rankings:{' '}
          {orphans.map((slot) => slot + 1).join(', ')}. Click those cells to re-enter them.
        </div>
      )}

      <div className="app__main">
        <DraftBoard
          picks={draft.picks}
          settings={draft.settings}
          playersById={playersById}
          currentSlot={currentSlot}
          onCellClick={openEditor}
        />
        <RosterPanel roster={myRoster} />
      </div>

      <AvailablePlayers
        available={available}
        onPick={(playerId) => {
          if (currentSlot !== null) handleSelect(playerId, currentSlot);
        }}
        canPick={currentSlot !== null}
      />

      {editingSlot !== null && (
        <div className="app__editor-backdrop" onClick={closeEditor}>
          <div className="app__editor" onClick={(e) => e.stopPropagation()}>
            <div className="app__editor-header">
              <span>{editingLabel}</span>
              <label className="app__editor-keeper">
                <input
                  type="checkbox"
                  checked={editingKeeper}
                  onChange={(e) => handleKeeperToggle(e.target.checked)}
                />
                ★ Keeper
              </label>
              {draft.picks[editingSlot] !== null && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'clearPick', pickNumber: editingSlot });
                    closeEditor();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <PlayerPicker
              players={enriched}
              draftedBy={draftedBy}
              targetSlot={editingSlot}
              autoFocus
              placeholder="Search players…"
              onSelect={handleEditorSelect}
              onCancel={closeEditor}
            />
          </div>
        </div>
      )}
    </div>
  );
}