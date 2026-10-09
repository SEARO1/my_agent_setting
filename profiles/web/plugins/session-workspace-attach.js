/**
 * session-workspace-attach — give Sessions this host did not create a Workspace home.
 *
 * Why. The sidebar draws each Workspace's own `sessionIds` account, and that account is written in
 * exactly three places — all owned by whoever *created* the Session: `dsh-api-session-controller`
 * (web create and subagent child) and `dsh-webhook`. A Session created by another process — a
 * `dsh --profile headless` watcher relay, for instance — therefore never becomes a member, and the
 * sidebar files it under "Ungrouped" instead of the directory it ran in. `WorkspaceRegistry`
 * reconciles the backlog only once, behind its durable `initialized` marker
 * (`dsh-workspace/lib/index.js:385`), so that bucket only grows: measured 2026-09-24, the FYP
 * Workspace held 7 of the 21 Sessions recorded for that directory.
 *
 * What. Once shortly after boot, then every `intervalMs`, attach each stored Session whose header
 * `cwd` resolves to a registered Workspace. `Workspace.attachSession`
 * (`dsh-workspace/lib/index.js:111`) validates that cwd against the Workspace path and teaches the
 * registry's header index the Session's path — the same index the membership getter filters by — so
 * the membership lands in the projection the sidebar reads and the workspace feed can push it.
 *
 * Scope. Additive only: nothing is detached, reordered or renamed, and no Session log is touched.
 * Delete the row in `cordis.patch.yml` (or this file) to stop it.
 *
 * @module dsh-profile-web/plugins/session-workspace-attach
 */
export const name = "session-workspace-attach";
export const inject = ["workspaceRegistry", "sessionQuery"];

/** Compare directory spellings the way the platform does, ignoring a trailing separator. */
function pathKey(value) {
  const trimmed = value.replace(/[\\/]+$/, "");
  return process.platform === "win32" ? trimmed.toLowerCase() : trimmed;
}

/** Attach every stored Session that belongs to a registered Workspace. */
export function apply(ctx, config = {}) {
  const intervalMs = Number.isSafeInteger(config.intervalMs) && config.intervalMs > 0 ? config.intervalMs : 60_000;
  const bootDelayMs = Number.isSafeInteger(config.bootDelayMs) && config.bootDelayMs >= 0 ? config.bootDelayMs : 5_000;
  let inFlight = false;

  const reconcile = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const workspaces = ctx.workspaceRegistry.list();
      if (workspaces.length === 0) return;
      const byPath = new Map(workspaces.map((workspace) => [pathKey(workspace.path), workspace]));
      let attached = 0;
      let refused = 0;
      for (const record of await ctx.sessionQuery.listSessions()) {
        const { header } = record;
        if (header.cwd === undefined) continue;
        const workspace = byPath.get(pathKey(header.cwd));
        if (workspace === undefined || workspace.sessionIds.includes(header.id)) continue;
        try {
          await workspace.attachSession(header.id);
          attached += 1;
        } catch (error) {
          refused += 1;
          ctx.logger?.debug?.(`${name}: ${header.id}: ${String(error)}`);
        }
      }
      if (attached > 0 || refused > 0) {
        ctx.logger?.info?.(`${name}: attached ${String(attached)} Session(s), refused ${String(refused)}`);
      }
    } catch (error) {
      ctx.logger?.warn?.(`${name}: reconcile failed: ${String(error)}`);
    } finally {
      inFlight = false;
    }
  };

  const boot = setTimeout(() => void reconcile(), bootDelayMs);
  const timer = setInterval(() => void reconcile(), intervalMs);
  ctx.effect(() => () => {
    clearTimeout(boot);
    clearInterval(timer);
  }, `${name}: reconcile timers`);
  ctx.logger?.info?.(`${name}: attaching Sessions to Workspaces every ${String(intervalMs)} ms`);
}
