// The ledger: SCATTER.EXE's SHA-256 hash chain (scatter_ledger), shared by both games. Helpers copied from scatter-exe
// src/ledger.js (which copied clutch-feed-tilt, aura-farm and scoundrel.exe).
//
//   hash = SHA-256( prev_hash + "|" + record )
//
// TriviaMoba writes two kinds of entry:
//   crowd  { day, registry, write, crowd }: the shared registry's chain head at 00:00 UTC (src/registry.js), the day's
//          two write prompt ids, and its crowd prompts with their counts frozen when the entry is sealed (crowd.js
//          snapshot). The prompts are picked from SHA-256("triviamoba|" + day + "|" + registry): fixed at midnight, the
//          same for everyone, recomputable by anyone, and nothing written after midnight can steer them.
//   write  { day, player, answers }: a player's two answers, sealed in the same D1 batch as the write and its counts.
// Records hold player ids, never names. prev_hash is UNIQUE, so the chain can't fork, whichever game writes next.

import { pickDay, snapshot } from "../public/engine/crowd.js";

export const GENESIS = "0".repeat(64);

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function head(db) {
  const h = await db.prepare("SELECT hash FROM scatter_ledger ORDER BY id DESC LIMIT 1").first();
  return h ? h.hash : GENESIS;
}

export const isUnique = (e) => /UNIQUE/i.test(String(e && e.message));

// The insert for one write's entry chained from `prev`: it finds the write row added earlier in the same batch.
export async function writeInsert(db, prev, { day, player, record, t }) {
  const hash = await sha256(prev + "|" + record);
  return db.prepare(
    `INSERT INTO scatter_ledger (kind, day, sheet_id, record, prev_hash, hash, created_at)
     SELECT 'write', ?1, id, ?2, ?3, ?4, ?5 FROM scatter_writes WHERE player_id = ?6 AND day = ?1 AND sealed_at = ?5`)
    .bind(day, record, prev, hash, t, player);
}

// The day's crowd entry (its record, parsed), sealing it first if it isn't on the chain yet. Two requests at once can't
// both seal one (scatter_ledger_one_crowd, prev_hash UNIQUE): the loser reads the winner's.
// `getRegistryHead` is an async function giving the registry's head at 00:00 UTC that day, called only when sealing.
export const daySeed = (day, registry) => sha256("triviamoba|" + day + "|" + registry);
export async function crowdDay(db, day, getRegistryHead, t) {
  for (let i = 0; i < 4; i++) {
    const got = await db.prepare("SELECT record FROM scatter_ledger WHERE kind = 'crowd' AND day = ?").bind(day).first();
    if (got) return JSON.parse(got.record);
    const registry = await getRegistryHead();
    const prev = await head(db);
    const { write, crowd } = pickDay(await daySeed(day, registry));
    const ids = [...new Set(crowd)];
    const { results } = await db.prepare(`SELECT prompt, k, text, n FROM scatter_counts WHERE prompt IN (${ids.map(() => "?").join(",")})`)
      .bind(...ids).all();
    const rec = { day, registry, write, crowd: crowd.map((id) => snapshot(id, results.filter((r) => r.prompt === id))) };
    const record = JSON.stringify(rec);
    try {
      await db.prepare("INSERT INTO scatter_ledger (kind, day, sheet_id, record, prev_hash, hash, created_at) VALUES ('crowd', ?, NULL, ?, ?, ?, ?)")
        .bind(day, record, prev, await sha256(prev + "|" + record), t).run();
      return rec;
    } catch (e) { if (!isUnique(e)) throw e; }
  }
  throw new Error("the ledger is busy");
}
