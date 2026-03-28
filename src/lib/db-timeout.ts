export const DB_QUERY_TIMEOUT_MS = 3000;

export function withTimeout<T>(promise: Promise<T>, ms: number = DB_QUERY_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms)
    ),
  ]);
}
