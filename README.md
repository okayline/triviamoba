# TriviaMoba

Trivia in three MOBA lanes. Draft 3 of 6 creatures into the lanes, answer each question, and push your marker in from the edge toward the common goal: a right answer pushes 2 (INT heals 2 in a lane you pick), a wrong one lets the map's wave push you back 1. Three lanes (DEF, STR, INT) against the map's creep waves: tap a lane's start pad each round, and the first lane you fill to space 5 wins. Two questions in every five of a lane are crowd rounds (no right answer: match the crowd). The board is a third of a wheel seen tilted from above, with towers and creeps.

This is the first prototype: one static page, `public/index.html`. The heroes and the 15 questions are hand-written sample data, and the page saves nothing yet. The backend (`src/worker.js`, `public/engine/crowd.js`) seals each day's crowd prompts and players' written answers on a ledger in the moba-beat database, sharing SCATTER.EXE's tables (`schema.sql`). Not built yet: the page using the API, accounts.

    npx wrangler d1 execute moba-beat --remote --file=migrations/001_crowd.sql   # before the first deploy that needs it
    npm test

Design: the Claude Doc "Lane Game: Design Notes".

Mystery prompts and their answer counts are from ProtoQA (Boratko et al., 2020), CC BY 4.0: https://github.com/iesl/protoqa-data
