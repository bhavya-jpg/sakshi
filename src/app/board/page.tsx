import { Board } from "@/components/Board"
import { DemoBadge } from "@/components/VerdictView"

export default function BoardPage() {
  const phase = process.env.NEXT_PUBLIC_BOARD_PHASE ?? "1"
  return (
    <div className="space-y-5">
      <div className="rounded-lg border-2 border-rose-600 bg-rose-50 p-4 text-sm text-rose-900">
        <div className="flex items-center gap-2 font-semibold"><DemoBadge /> This is a mock notice board</div>
        <p className="mt-1">
          Every notice here is synthetic and fictional. It exists so anyone can reproduce what Sakshi records when a
          publisher silently edits a notice or takes it down. It is not a government website.
        </p>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Demo Staff Selection Board (fictional)</h1>
      <p className="text-sm text-stone-600">
        Board phase <strong>{phase}</strong>.{" "}
        {phase === "1"
          ? "All three notices are published as first issued."
          : "Notice 2's last date was quietly moved from 30 Nov to 05 Nov, and notice 3 was removed. The URLs did not change."}
      </p>
      <Board />
      <p className="text-xs text-stone-500">
        The board changes between phases by redeploying the same URLs with different files (see README → &quot;Reproduce the
        demo&quot;). Witnesses fetched these URLs in each phase and wrote what they saw to Arkiv.
      </p>
    </div>
  )
}
