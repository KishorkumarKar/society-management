import { logger } from './logger';

/**
 * ErrorBoundary (components/ErrorBoundary.tsx) only catches errors thrown
 * during React's render — it does nothing for an error thrown inside an
 * event handler, a timer callback, or a rejected promise nobody awaited.
 * This covers that other half: RN's global `ErrorUtils` for synchronous JS
 * exceptions, and Hermes'/RN's unhandled-rejection tracking for promises.
 * Call once, as early as possible (see App.tsx).
 */
export function installGlobalErrorLogging(): void {
  const g = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
    HermesInternal?: unknown;
  };

  if (g.ErrorUtils) {
    const previousHandler = g.ErrorUtils.getGlobalHandler();
    g.ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('app', `Uncaught ${isFatal ? 'fatal' : 'non-fatal'} error: ${err.message}`, { stack: err.stack });
      previousHandler?.(error, isFatal);
    });
  }

  // Covers `somePromise.then(...)` with no `.catch`, and `await` inside an
  // async function whose caller never awaited it. Hermes (RN's default JS
  // engine) exposes this the same way the DOM does.
  const globalAny = globalThis as unknown as { addEventListener?: (event: string, cb: (e: unknown) => void) => void };
  globalAny.addEventListener?.('unhandledrejection', (event: unknown) => {
    const reason = (event as { reason?: unknown })?.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('app', `Unhandled promise rejection: ${err.message}`, { stack: err.stack });
  });
}
