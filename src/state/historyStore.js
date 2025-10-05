// src/state/historyStore.js
import { create } from 'zustand';

const LIMIT = 201; // baseline + last 5 activities

export const useHistory = create((set, get) => ({
  undoStack: [],              // [{ kind, snapshot }]
  redoStack: [],
  canUndo: false,
  canRedo: false,
  _lastHash: null,            // de-dupe

  // first snapshot at mount
  baseline(snapshot) {
    set({
      undoStack: [{ kind: 'init', snapshot }],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      _lastHash: JSON.stringify(snapshot),
    });
  },

  // commit on any activity
  commit(kind, snapshot) {
    const json = JSON.stringify(snapshot);
    if (json === get()._lastHash) return; // ignore duplicates

    let next = [...get().undoStack, { kind, snapshot }];
    if (next.length > LIMIT) next = next.slice(next.length - LIMIT);

    set({
      undoStack: next,
      redoStack: [],
      canUndo: next.length > 1,
      canRedo: false,
      _lastHash: json,
    });
  },

  undo() {
    const { undoStack, redoStack } = get();
    if (undoStack.length <= 1) return null;
    const curr = undoStack[undoStack.length - 1];
    const prev = undoStack[undoStack.length - 2];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, curr],
      canUndo: undoStack.length - 1 > 1,
      canRedo: true,
      _lastHash: JSON.stringify(prev.snapshot),
    });
    return prev.snapshot; // caller loads it
  },

  redo() {
    const { undoStack, redoStack } = get();
    if (!redoStack.length) return null;
    const next = redoStack[redoStack.length - 1];
    set({
      undoStack: [...undoStack, next],
      redoStack: redoStack.slice(0, -1),
      canUndo: true,
      canRedo: redoStack.length - 1 > 0,
      _lastHash: JSON.stringify(next.snapshot),
    });
    return next.snapshot; // caller loads it
  },
}));
