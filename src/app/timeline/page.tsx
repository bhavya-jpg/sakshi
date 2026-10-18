import { Suspense } from "react"
import { Timeline } from "@/components/Timeline"

export default function TimelinePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">URL timeline</h1>
      <p className="text-sm text-stone-600">
        Every record witnesses have made for one notice URL: when a file was first seen, when the URL started serving a
        different file, and when it stopped serving anything.
      </p>
      <Suspense><Timeline /></Suspense>
    </div>
  )
}
