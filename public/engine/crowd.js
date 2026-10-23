// TriviaMoba crowd rules, loaded by the Worker, the page and the tests. Change a rule here, once.
//
// Each UTC day has 2 WRITE prompts (everyone types one answer to each) and CROWD_PER_DAY crowd prompts (the "match the
// crowd" rounds, 2 per spoke). Both are picked from the hash before the day's ledger entry, and the crowd prompts' counts
// are frozen into that entry, so everyone plays the same words and the same counts all day. What people write today is
// added to the counts at once but only shows up in a later day's entry.
//
// Starting counts: ProtoQA (Boratko et al., 2020), CC BY 4.0, https://github.com/iesl/protoqa-data. Top four answers of
// each prompt; prompts chosen for no bad vibes and no dated answers. Players' answers add to them.

export const WRITE_PER_DAY = 2;
export const CROWD_PER_DAY = 6;   // 3 spokes x 2 crowd rounds
export const TOP = 4;             // options shown in a crowd round
export const MAX_LEN = 40;        // characters in one answer

export const PROMPTS = [
  { id: 1, q: "Name something a 17th-century pirate might think the moon was.", a: [["Cheese", 33], ["A star", 23], ["A light", 17], ["A god", 15]] },
  { id: 2, q: "Name something spies wear to disguise who they are.", a: [["Sunglasses", 38], ["A mask", 27], ["A wig", 27], ["Facial hair", 4]] },
  { id: 3, q: "Name something a soldier should always have with him.", a: [["A weapon", 62], ["Dog tags", 26], ["A helmet", 2], ["A compass", 2]] },
  { id: 4, q: "Name a hat you don't see many people wear in real life.", a: [["Top hat", 45], ["Cowboy hat", 28], ["Fedora", 6], ["Straw hat", 5]] },
  { id: 5, q: "Name something in your home a ghost might turn on and off.", a: [["The lights", 77], ["The TV", 12], ["The radio", 4], ["A fan", 2]] },
  { id: 6, q: "Name somewhere a little kid thinks a monster is hiding.", a: [["The closet", 59], ["Under the bed", 34], ["The basement", 3], ["The attic", 2]] },
  { id: 7, q: "Name something a witch could ride if her broom broke.", a: [["A mop", 27], ["A vacuum", 27], ["A stick", 7], ["A bicycle", 7]] },
  { id: 8, q: "Name something a pirate takes off before bed.", a: [["Eye patch", 32], ["Hook", 24], ["Hat", 21], ["Wooden leg", 7]] },
  { id: 9, q: "Name something that's harder to do in outer space.", a: [["Breathe", 37], ["Walk", 34], ["Go to the bathroom", 16], ["Eat", 13]] },
  { id: 10, q: "Name a chore you'd want a robot to do.", a: [["Dishes", 35], ["Laundry", 31], ["Clean the bathroom", 10], ["Vacuum", 10]] },
];
export const prompt = (id) => PROMPTS.find((p) => p.id === id) || null;

// A small seeded random number generator (mulberry32) from the first 8 hex digits of a hash (as scatter-exe).
function rng(hex) {
  let a = parseInt(hex.slice(0, 8), 16) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n different ids from the list, in a seeded order. With fewer prompts than n, the list goes round again.
function draw(rand, ids, n) {
  const out = [];
  while (out.length < n) {
    const pool = ids.slice();
    while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

// The day's prompt ids from a 64-digit hex hash: { write: [2 ids], crowd: [CROWD_PER_DAY ids] }.
export function pickDay(hex) {
  const rand = rng(hex), ids = PROMPTS.map((p) => p.id);
  return { write: draw(rand, ids, WRITE_PER_DAY), crowd: draw(rand, ids, CROWD_PER_DAY) };
}

// An answer as it is kept: spaces trimmed and squashed, at most MAX_LEN characters.
export const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LEN);

// The key two answers share when they are the same answer: lower case, no leading "a"/"an"/"the", letters and digits only.
// "The Lights", "lights!" and "the lights" are one answer.
export const key = (s) => clean(s).toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/[^a-z0-9]/g, "");

// No bad vibes: answers with these words are refused. A short list; it grows when something gets through.
const BLOCK = /\b(fuck|shit|bitch|cunt|dick|cock|pussy|nigg|fag|retard|rape|nazi|kill yourself|kys|porn|sex)/i;
export const allowed = (s) => !BLOCK.test(clean(s));

// A crowd prompt's options as of now: the starting counts plus players' answers (rows of { k, text, n }), merged by key,
// biggest first, top TOP. Returns { id, q, options: [{ a, n }], total, players }.
export function snapshot(id, rows = []) {
  const p = prompt(id), by = new Map();
  for (const [a, n] of p.a) by.set(key(a), { a, n });
  let players = 0;
  for (const r of rows) {
    players += r.n;
    const o = by.get(r.k);
    if (o) o.n += r.n; else by.set(r.k, { a: r.text, n: r.n });
  }
  const all = [...by.values()].sort((x, y) => y.n - x.n || x.a.localeCompare(y.a));
  return { id, q: p.q, options: all.slice(0, TOP), total: all.reduce((s, o) => s + o.n, 0), players };
}
