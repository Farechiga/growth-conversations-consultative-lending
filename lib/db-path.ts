/*
 * Sprint 6 Block D — production SQLite path resolution.
 *
 * Vercel's serverless runtime exposes a read-only filesystem except
 * `/tmp`, which is writable but per-Lambda-instance and ephemeral.
 * Better-sqlite3 needs to open the database file with write access for
 * the demo's live-insight-authoring beat to succeed (writes vanish when
 * the Lambda recycles; that's the accepted read-heavy-demo constraint
 * documented in OPEN_QUESTIONS Q-F7).
 *
 * On Vercel, this helper copies the bundled seed snapshot at
 * `prisma/seed.db` to `/tmp/blaze.db` on first invocation per Lambda
 * instance, then returns the writable `/tmp` path. Locally, it falls
 * through to the path declared in `DATABASE_URL` (default `./dev.db`).
 */

import fs from "node:fs";
import path from "node:path";

let cached: string | null = null;

/**
 * Vercel-bundled snapshot location. Static (not derived from env vars)
 * so Turbopack's file-tracing pass can resolve it. Refreshed via
 * `pnpm db:snapshot` before each deploy.
 */
const BUNDLED_SNAPSHOT_REL = "prisma/seed.db";

function envPath(): string {
  return (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
}

export function getDbPath(): string {
  if (cached) return cached;

  // Vercel sets VERCEL=1 on all runtimes (preview, production, dev).
  const isVercel = process.env.VERCEL === "1";

  if (!isVercel) {
    cached = envPath();
    return cached;
  }

  const tmpPath = "/tmp/blaze.db";
  if (!fs.existsSync(tmpPath)) {
    const bundledAbs = path.join(process.cwd(), BUNDLED_SNAPSHOT_REL);
    if (!fs.existsSync(bundledAbs)) {
      throw new Error(
        `[db-path] Bundled SQLite snapshot not found at ${bundledAbs}. ` +
          `Run \`pnpm db:snapshot\` and redeploy.`,
      );
    }
    fs.copyFileSync(bundledAbs, tmpPath);
  }
  cached = tmpPath;
  return tmpPath;
}
