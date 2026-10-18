// Copies the DEMO board files for the current phase to public/board/ before a build.
// Phase 1: notices 1-3 as first published. Phase 2: notice 2 edited, notice 3 removed (404).
import { cpSync, rmSync } from "node:fs"
const phase = process.env.NEXT_PUBLIC_BOARD_PHASE === "2" ? "2" : "1"
rmSync("public/board", { recursive: true, force: true })
cpSync(`public/board-files/v${phase}`, "public/board", { recursive: true })
console.log(`demo board phase ${phase} → public/board/`)
