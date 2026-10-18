import { Board } from "@/components/Board"

export default function BoardPage() {
  const phase = process.env.NEXT_PUBLIC_BOARD_PHASE ?? "1"
  return (
    <div>
      <div className="border-b-2 border-signal bg-signal text-white" role="note">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
          <p className="mono text-[12px] font-semibold uppercase tracking-[0.14em]">Demonstration environment · Synthetic notices</p>
          <p className="text-[12px] opacity-90">Every notice below is fictional. This is not a government website.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-16">
        <header className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker fade-in">Nº 03 · Demo board</p>
            <h1 className="display mt-4 text-[clamp(2.75rem,7vw,5.5rem)]">
              <span className="line-mask"><span>A notice board</span></span>
              <span className="line-mask"><span style={{ animationDelay: "100ms" }}>that <em className="italic text-accent">changes.</em></span></span>
            </h1>
          </div>
          <div className="fade-in self-end space-y-3 text-[15px] leading-relaxed text-ink-2 lg:col-span-4 lg:col-start-9" style={{ animationDelay: "400ms" }}>
            <p>
              A mock publisher, so anyone can reproduce what Sakshi records when a notice is quietly edited or taken down.
              The URLs stay the same between phases; only what they serve changes.
            </p>
            <p className="text-[13px]">
              {phase === "1"
                ? "Phase 1: all three notices as first published."
                : "Phase 2: notice 2's last date moved from 30 Nov to 05 Nov, and notice 3 withdrawn."}
            </p>
          </div>
        </header>
        <Board />
        <p className="mt-6 max-w-2xl text-[12px] text-ink-3">
          The board moves between phases by redeploying the same URLs with different files (README → &quot;Reproduce the
          demo&quot;). The PDFs are generated deterministically by <span className="mono">scripts/make-board.ts</span>, so their
          fingerprints never drift.
        </p>
      </div>
    </div>
  )
}
