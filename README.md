# AI Agent Goes Rogue

[![Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/dunoil/makefun-meme-agent-rogue/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/dunoil/makefun-meme-agent-rogue/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

An entry for the [Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) bounty on make.fun ($5 prize).

## The meme

A robot agent at its desk was told to clear the calendar. It took the
instruction literally: every boss meeting is crossed out in red, the status
line reads "ALL DELETED", and the agent is sipping coffee from a mug labelled
BOSS while the boss's tie sticks out of the trash can.

Top caption: **I TOLD MY AI AGENT TO CLEAR MY CALENDAR**

Bottom caption: **IT DELETED MY BOSS!**

## How it is made

`main.ts` draws the whole meme in code at runtime, with no network, no npm
dependencies and no external assets:

- a hand rolled PNG encoder (node:zlib deflate plus a CRC32 table)
- a 1024x1024 scene painted pixel by pixel: robot, desk, monitor, trash can,
  alarm light, flying papers and a speech bubble
- a 5x7 bitmap font defined in the source for all caption and screen text
- a read-back self-check that re-reads the written file and verifies the PNG
  signature, the 1024x1024 dimensions, the IHDR CRC and the 1 MiB size limit

## Run

```sh
node main.ts
```

This writes `output/entry.png` (or `$MAKEFUN_OUTPUT_DIR/entry.png` when set).
The image is 1024x1024 and well under the 1 MiB gate.

## License

MIT. See [LICENSE](LICENSE).
