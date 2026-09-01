const timestamp = () => new Date().toISOString();

/**
 * Minimal dependency-free logger. Swap this out for winston/pino later
 * without touching any call sites, since everything imports from here.
 */
const logger = {
  info: (...args) => console.log(`[INFO] ${timestamp()} -`, ...args),
  warn: (...args) => console.warn(`[WARN] ${timestamp()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()} -`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${timestamp()} -`, ...args);
    }
  },
};

export default logger;
