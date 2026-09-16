import { create } from "zustand";
import { CallEvent, CallState } from "./types";
import { IDLE, reduce } from "./reduce";

type CallStore = {
  state: CallState;
  dispatch: (event: CallEvent) => void;
  reset: () => void;
};

export const useCallStore = create<CallStore>((set) => ({
  state: IDLE,
  dispatch: (event) => set((store) => ({ state: reduce(store.state, event) })),
  reset: () => set({ state: IDLE }),
}));

export const useCallState = (): CallState => useCallStore((s) => s.state);
export const useCallDispatch = (): ((event: CallEvent) => void) =>
  useCallStore((s) => s.dispatch);
