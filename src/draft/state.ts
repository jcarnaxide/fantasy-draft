import type { Pick, DraftSettings, DraftState, Action } from '../types';

const MAX_HISTORY = 50;

export function createInitialState(settings: DraftSettings): DraftState {
  return {
    settings,
    picks: Array.from({ length: settings.rounds * settings.managers.length }, () => null),
    history: [],
  };
}

function inBounds(state: DraftState, pickNumber: number): boolean {
  return Number.isInteger(pickNumber) && pickNumber >= 0 && pickNumber < state.picks.length;
}

/** Push the current picks onto history, trimming the oldest beyond MAX_HISTORY. */
function pushHistory(state: DraftState): (Pick | null)[][] {
  const next = [...state.history, state.picks];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export function draftReducer(state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'setPick': {
      if (!inBounds(state, action.pickNumber)) return state;

      const pick: Pick = {
        playerId: action.playerId,
        timestamp: action.pickedAt ?? Date.now(),
        isKeeper: action.isKeeper ?? false,
      };

      return {
        ...state,
        picks: state.picks.with(action.pickNumber, pick),
        history: pushHistory(state),
      };
    }

    case 'clearPick': {
      if (!inBounds(state, action.pickNumber)) return state;
      if (state.picks[action.pickNumber] === null) return state;

      return {
        ...state,
        picks: state.picks.with(action.pickNumber, null),
        history: pushHistory(state),
      };
    }

    case 'undo': {
      const previous = state.history[state.history.length - 1];
      if (previous === undefined) return state;

      return {
        ...state,
        picks: previous,
        history: state.history.slice(0, -1),
      };
    }

    case 'reset': {
      return createInitialState(state.settings);
    }

    default: {
      // Compile-time exhaustiveness guard: adding a new Action variant without a
      // case above makes this assignment fail. At runtime, unknown actions no-op.
      const exhaustive: never = action;
      void exhaustive;
      return state;
    }
  }
}
