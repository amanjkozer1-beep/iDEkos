import { StateCreator } from 'zustand';

export const loggerMiddleware =
  <T extends unknown>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (...args) => {
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as any).__KOS_DEBUG__) {
          console.log('[K.O.S Store Action]:', args);
        }
        set(...args);
      },
      get,
      api
    );
