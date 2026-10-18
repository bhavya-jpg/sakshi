import { Suspense } from "react"
import { Timeline } from "@/components/Timeline"

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-16">
      <header className="grid grid-cols-1 gap-6 pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="kicker fade-in">Nº 02 · Timeline</p>
          <h1 className="display mt-4 text-[clamp(2.75rem,7vw,5.5rem)]">
            <span className="line-mask"><span>What a URL</span></span>
            <span className="line-mask"><span style={{ animationDelay: "100ms" }}><em className="italic text-forest">served</em>, and when.</span></span>
          </h1>
        </div>
        <p className="fade-in self-end text-[15px] leading-relaxed text-ink-2 lg:col-span-4 lg:col-start-9" style={{ animationDelay: "400ms" }}>
          Every record witnesses have made for one notice URL: when a file was first seen, when the URL began serving a
          different file, and when it stopped serving anything.
        </p>
      </header>
      <Suspense><Timeline /></Suspense>
    </div>
  )
}
