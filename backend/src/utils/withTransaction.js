import mongoose from "mongoose";

let transactionsUnsupported = false;

/**
 * Runs `fn` inside a MongoDB multi-document transaction so that a
 * controller doing several writes either commits all of them or none -
 * a mid-operation failure rolls back cleanly instead of leaving the
 * database (and therefore the client, on its retry) in a half-applied
 * state.
 *
 * Usage:
 *   await withTransaction(async (session) => {
 *     await Doc.create([payload], { session });
 *     await other.save({ session });
 *   });
 *
 * `fn` receives the session (or `null` in the standalone-mongo fallback);
 * pass it to every write it performs. `session.withTransaction` handles
 * commit/abort and transient-error retries. The return value of `fn` is
 * propagated.
 *
 * Fallback: transactions require a replica set. On a standalone local
 * mongo the first attempt throws a specific error; after that this runs
 * `fn(null)` directly (no atomicity) and logs one warning, so local dev
 * keeps working. Production (Atlas) is always a replica set.
 */
export async function withTransaction(fn) {
  if (transactionsUnsupported) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    const msg = String(err?.message || "");
    if (
      err?.code === 20 ||
      /Transaction numbers are only allowed/i.test(msg) ||
      /replica set/i.test(msg) ||
      /not supported/i.test(msg)
    ) {
      transactionsUnsupported = true;
      // eslint-disable-next-line no-console
      console.warn(
        "⚠️  MongoDB transactions unavailable (no replica set) - running multi-write operations non-atomically. This is fine for local dev; production should use a replica set / Atlas.",
      );
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
