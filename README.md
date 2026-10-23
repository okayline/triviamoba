# TriviaMoba

Trivia in three MOBA lanes. Draft 3 of 6 creatures into the lanes, commit a CLUTCH, FEED or TILT call before each question, answer, and push the marker along the lane toward the ghost's base. Each lane is up to 3 rounds on a path of 5 tiles, with 0 or 1 mystery question (no right answer: match the ghost's pick). The board is a third of a wheel seen tilted from above, with flavor towers and creeps.

This is the first prototype: one static page, `public/index.html`. The heroes, the 20 questions and the ghost's moves are hand-written sample data, and the page saves nothing yet. The backend (`src/worker.js`, `public/engine/crowd.js`) seals each day's crowd prompts and players' written answers on a ledger in the moba-beat database, sharing SCATTER.EXE's tables (`schema.sql`). Not built yet: the page using the API, accounts, real ghosts from other players' lineups.

    npx wrangler d1 execute moba-beat --remote --file=migrations/001_crowd.sql   # before the first deploy that needs it
    npm test

Design: the Claude Doc "Lane Game: Design Notes".

Mystery prompts and their answer counts are from ProtoQA (Boratko et al., 2020), CC BY 4.0: https://github.com/iesl/protoqa-data
