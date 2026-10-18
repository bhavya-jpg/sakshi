import { Verify } from "@/components/Verify"

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-16">
      <header className="grid grid-cols-1 gap-6 border-b border-ink pb-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="kicker fade-in">Nº 01 · Verify</p>
          <h1 className="display mt-4 text-[clamp(2.75rem,7vw,5.5rem)]">
            <span className="line-mask"><span>Examine a</span></span>
            <span className="line-mask"><span style={{ animationDelay: "100ms" }}><em className="italic text-forest">document.</em></span></span>
          </h1>
        </div>
        <p className="fade-in self-end text-[15px] leading-relaxed text-ink-2 lg:col-span-4 lg:col-start-9" style={{ animationDelay: "400ms" }}>
          Your browser computes the file&apos;s SHA-256 and asks Arkiv which trusted witnesses recorded that exact file,
          where, and when.
        </p>
      </header>
      <div className="pt-10"><Verify /></div>
    </div>
  )
}
