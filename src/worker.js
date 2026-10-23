// TriviaMoba Worker. The page and its files are static assets; /api/* comes here first. The data lives in the moba-beat
// database, in SCATTER.EXE's tables plus TriviaMoba's own (schema.sql).
//
//   GET  /api/today                      { day, nextIn, registry, write, crowd, mine? }: today's UTC date (the server's clock),
//                                        the shared registry head the day was picked from,
//                                        the two write prompts ({ id, q }), the crowd rounds ({ id, q, options: [a] },
//                                        no counts), and your sealed answers, entry and hash if you wrote today.
//   GET  /api/seed?day=YYYY-MM-DD        { day, registry, seed, seed_hash }: a finished day's seed, so anyone can check its
//                                        picks. 403 for today or later, 404 for a day with no seed on the ledger.
//   POST /api/write {day, answers: [2]}  seal your two answers on the ledger, once a day. Blank is allowed; an answer
//                                        with a blocked word is refused. They add to the counts, which only show in a
//                                        later day's crowd entry.
//
// The rules are public/engine/crowd.js, the same file the page loads. The day's seed is made with the Worker secret
// DAILY_SECRET (src/ledger.js daySeed) and never leaves the Worker; the day's entry holds only its hash.

import { sha256, head, writeInsert, crowdDay, daySeed, isUnique } from "./ledger.js";
import * as C from "../public/engine/crowd.js";
import { registryHeadAt } from "./registry.js";

const COOKIE = "tm";
const COOKIE_MAX_AGE = 400 * 86400;
const SEEN_EVERY = 900;   // 15 minutes

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS ? env.ASSETS.fetch(req) : new Response("Not found", { status: 404 });
    try {
      const route = ROUTES[`${req.method} ${url.pathname}`];
      if (!route) return json({ error: "No such thing." }, 404);
      return await route(req, env, url);
    } catch (e) {
      if (e instanceof Oops) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Something broke. Try again in a moment." }, 500);
    }
  },
};

class Oops extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// ---------- helpers (copied from scatter-exe src/worker.js) ----------

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

// the clock, in unix seconds (tests move it with setClock)
let clock = () => Math.floor(Date.now() / 1000);
export function setClock(fn) { clock = fn; }
const now = () => clock();
const utcDay = (t = now()) => new Date(t * 1000).toISOString().slice(0, 10);
const dayEnd = (day) => Date.parse(day + "T00:00:00Z") / 1000 + 86400;

function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function readCookie(req) {
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,})`));
  return m ? m[1] : null;
}

const setCookie = (token) => `${COOKIE}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
const withCookie = (res, cookie) => { if (cookie) res.headers.append("set-cookie", cookie); return res; };

// The player behind this request's cookie, or null. Never creates one (so crawlers don't make players).
async function findPlayer(req, env) {
  const token = readCookie(req);
  if (!token) return null;
  const p = await env.DB.prepare("SELECT id, seen_at FROM scatter_players WHERE token_hash = ?").bind(await sha256(token)).first();
  if (!p) return null;
  if (now() - p.seen_at >= SEEN_EVERY) await env.DB.prepare("UPDATE scatter_players SET seen_at = ? WHERE id = ?").bind(now(), p.id).run();
  return p;
}

// The player behind this request, made on the spot if there isn't one. Returns { player, cookie? }.
async function needPlayer(req, env) {
  const found = await findPlayer(req, env);
  if (found) return { player: found };
  if (!(await rateLimit(env, req, "new-guest", 3, 3600))) throw new Oops("Too many new players from here. Try again later.", 429);
  const token = newToken(), t = now();
  const r = await env.DB.prepare("INSERT INTO scatter_players (token_hash, created_at, seen_at) VALUES (?, ?, ?) RETURNING id")
    .bind(await sha256(token), t, t).first();
  return { player: r, cookie: setCookie(token) };
}

// Fixed window per hashed IP and action. Returns true if allowed.
async function rateLimit(env, req, action, limit, windowSecs) {
  const ip = req.headers.get("cf-connecting-ip") || "unknown";
  const key = action + ":" + (await sha256("ip:" + ip)).slice(0, 32);
  const t = now(), windowStart = t - (t % windowSecs);
  const row = await env.DB.prepare(
    `INSERT INTO scatter_rate_limits (key, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = count + 1 RETURNING count`).bind(key, windowStart).first();
  if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM scatter_rate_limits WHERE window_start < ?").bind(t - 86400).run();
  return row.count <= limit;
}

async function body(req) {
  try { return await req.json(); } catch { throw new Oops("That request didn't make sense."); }
}

// ---------- the day ----------

// The day's crowd entry. A registry that can't be read leaves the day unsealed; the next request tries again.
const today_ = (env, day) => {
  if (!env.DAILY_SECRET) { console.error("The Worker has no DAILY_SECRET set."); throw new Oops("Today's questions aren't ready yet. Try again in a moment.", 503); }
  return crowdDay(env.DB, day, () => registryHeadAt(day).catch((e) => {
    console.error(e); throw new Oops("Today's questions aren't ready yet. Try again in a moment.", 503);
  }), now(), env.DAILY_SECRET);
};

// What the page sees: crowd rounds without their counts (the counts are on the ledger entry, for anyone who looks).
async function view(env, player, day) {
  const d = await today_(env, day);
  const out = {
    day, nextIn: dayEnd(day) - now(), registry: d.registry,
    write: d.write.map((id) => ({ id, q: C.prompt(id).q })),
    crowd: d.crowd.map((c) => ({ id: c.id, q: c.q, options: c.options.map((o) => o.a) })),
  };
  const w = player && await env.DB.prepare(
    `SELECT w.answers, l.id AS entry, l.hash FROM scatter_writes w LEFT JOIN scatter_ledger l ON l.kind = 'write' AND l.sheet_id = w.id
     WHERE w.player_id = ? AND w.day = ?`).bind(player.id, day).first();
  if (w) out.mine = { answers: JSON.parse(w.answers), entry: w.entry, hash: w.hash };
  return out;
}

async function today(req, env) {
  return json(await view(env, await findPlayer(req, env), utcDay()));
}

// Seal today's two answers: the write row, its ledger entry and the counts in one D1 batch (all or nothing).
async function write(req, env) {
  const b = await body(req);
  const day = utcDay();
  if (b.day !== day) throw new Oops("That day is over. Here's today's.", 409);
  const { player, cookie } = await needPlayer(req, env);
  const d = await today_(env, day);
  if (!Array.isArray(b.answers) || b.answers.length !== d.write.length) throw new Oops(`Write ${d.write.length} answers (blank is fine).`);
  const answers = d.write.map((id, i) => ({ prompt: id, a: C.clean(b.answers[i]) }));
  const bad = answers.find((x) => !C.allowed(x.a));
  if (bad) throw new Oops("Let's keep it friendly. Try another answer.");
  for (let i = 0; i < 6; i++) {
    const t = now();
    const record = JSON.stringify({ day, player: player.id, answers, t });
    const stmts = [
      env.DB.prepare("INSERT INTO scatter_writes (player_id, day, answers, sealed_at) VALUES (?, ?, ?, ?)").bind(player.id, day, JSON.stringify(answers), t),
      await writeInsert(env.DB, await head(env.DB), { day, player: player.id, record, t }),
      ...answers.filter((x) => C.key(x.a)).map((x) => env.DB.prepare(
        "INSERT INTO scatter_counts (prompt, k, text, n) VALUES (?, ?, ?, 1) ON CONFLICT (prompt, k) DO UPDATE SET n = n + 1")
        .bind(x.prompt, C.key(x.a), x.a)),
    ];
    try { await env.DB.batch(stmts); }
    catch (e) {
      if (!isUnique(e)) throw e;
      // a write already there, or someone sealed something first: build on the new head
      if (await env.DB.prepare("SELECT 1 FROM scatter_writes WHERE player_id = ? AND day = ?").bind(player.id, day).first())
        throw new Oops("You already wrote today.", 409);
      continue;
    }
    return withCookie(json(await view(env, player, day)), cookie);
  }
  throw new Error("The ledger is busy. Try again.");
}

// A finished day's seed. It is made again from the secret and the registry head the day's entry holds, and shown only if
// its hash is the seed_hash sealed on the ledger (a changed secret would give a seed that doesn't match, so it is never shown).
async function seedOf(req, env, url) {
  const day = url.searchParams.get("day") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day + "T00:00:00Z"))) throw new Oops("Give a day like 2027-01-01.");
  if (day >= utcDay()) throw new Oops("A day's seed is shown once the day is over.", 403);
  if (!env.DAILY_SECRET) throw new Oops("Not available right now.", 503);
  const got = await env.DB.prepare("SELECT record FROM scatter_ledger WHERE kind = 'crowd' AND day = ?").bind(day).first();
  const rec = got && JSON.parse(got.record);
  if (!rec || !rec.seed_hash) throw new Oops("No seed was sealed for that day.", 404);
  const seed = await daySeed(env.DAILY_SECRET, day, rec.registry);
  if ((await sha256(seed)) !== rec.seed_hash) throw new Error("The seed for " + day + " doesn't match its hash on the ledger.");
  return json({ day, registry: rec.registry, seed, seed_hash: rec.seed_hash });
}

const ROUTES = {
  "GET /api/today": today,
  "GET /api/seed": seedOf,
  "POST /api/write": write,
};
