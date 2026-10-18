import Link from "next/link"
import { Reveal } from "@/components/Reveal"
import { Specimen } from "@/components/Specimen"

const steps = [
  {
    n: "I", title: "Document", kicker: "On your device",
    body: "You hold a PDF that someone forwarded to you. It never leaves your device.",
    detail: "notice.pdf · 2.3 KB",
  },
  {
    n: "II", title: "SHA-256", kicker: "A fingerprint",
    body: "Your browser computes the file's SHA-256. Change one byte of the file and the fingerprint is completely different.",
    detail: "0x1a89d92e…6c5a",
  },
  {
    n: "III", title: "Arkiv query", kicker: "The public record",
    body: "The fingerprint is looked up on Arkiv, the Web3 database, where independent witnesses record which file each notice URL served.",
    detail: "doc_sha256 = bytes32(h)",
  },
  {
    n: "IV", title: "Observation history", kicker: "What was seen",
    body: "You see who recorded the file, at which URL and when, and whether that URL later changed or went dark.",
    detail: "seen → changed → gone",
  },
]

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      {/* ── Hero ── */}
      <section className="grid grid-cols-1 gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-28">
        <div className="lg:col-span-7">
          <p className="kicker fade-in">Nº 01 · Evidence, not assertion</p>
          <h1 className="display mt-6 text-[clamp(3.4rem,10vw,8.25rem)]">
            <span className="line-mask"><span>The truth</span></span>
            <span className="line-mask"><span style={{ animationDelay: "120ms" }}>leaves a <em className="font-[340] italic text-forest">trace.</em></span></span>
          </h1>
          <div className="fade-in mt-10 grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto] sm:items-end" style={{ animationDelay: "450ms" }}>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-2">
              Notices get forwarded as PDFs, and the pages that published them change or vanish. Sakshi checks a document
              against observations that independent witnesses recorded: which exact file a notice URL served, and when.
            </p>
          </div>
          <div className="fade-in mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "600ms" }}>
            <Link href="/verify/" className="btn btn-solid">Examine a document <span className="arrow" aria-hidden>→</span></Link>
            <Link href="/board/" className="btn">Open the demo board</Link>
          </div>
        </div>
        <div className="lg:col-span-5 lg:pt-6">
          <Specimen />
        </div>
      </section>

      {/* ── Method ── */}
      <section className="border-t border-ink pt-8" aria-labelledby="method">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Reveal className="reveal lg:col-span-4">
            <p className="kicker">Nº 02 · The method</p>
            <h2 id="method" className="serif mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.02] tracking-[-0.02em]">
              From a file in your hand to a public history.
            </h2>
          </Reveal>
          <Reveal className="reveal text-[15px] leading-relaxed text-ink-2 lg:col-span-5 lg:col-start-8 lg:pt-10" delay={120}>
            No upload, no account, no Sakshi server. Your browser does all four steps itself, using the same queries that
            anyone can run from the command line.
          </Reveal>
        </div>

        <div className="relative mt-16">
          {/* connecting rule, drawn once in view */}
          <Reveal className="draw pointer-events-none absolute left-0 right-0 top-[7px] hidden md:block">
            <svg className="h-4 w-full" preserveAspectRatio="none" viewBox="0 0 1000 16" fill="none">
              <line x1="0" y1="8" x2="1000" y2="8" stroke="var(--ink)" strokeWidth="1" style={{ ["--len" as string]: 1000 }} />
            </svg>
          </Reveal>
        <ol className="relative grid grid-cols-1 gap-y-12 md:grid-cols-4 md:gap-x-8">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} className="reveal relative pl-6 md:pl-0" delay={i * 140}>
              <span className="absolute left-0 top-[3px] h-[9px] w-[9px] rounded-full border border-ink bg-paper md:relative md:top-0 md:block" />
              <span className="absolute bottom-0 left-[4px] top-4 w-px bg-rule md:hidden" aria-hidden />
              <p className="kicker md:mt-6">{s.n} · {s.kicker}</p>
              <h3 className="serif mt-2 text-[28px] leading-tight tracking-[-0.015em]">{s.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
              <p className="mono mt-4 border-t border-rule pt-2 text-[11.5px] text-forest">{s.detail}</p>
            </Reveal>
          ))}
        </ol>
        </div>
      </section>

      {/* ── What the result means ── */}
      <section className="mt-28 grid grid-cols-1 gap-12 lg:grid-cols-12" aria-labelledby="meaning">
        <Reveal className="reveal lg:col-span-3">
          <p className="kicker">Nº 03 · Reading a result</p>
          <h2 id="meaning" className="sr-only">What a result means</h2>
        </Reveal>
        <Reveal className="reveal border-t border-forest pt-5 lg:col-span-4" delay={80}>
          <p className="serif text-[26px] leading-snug">A match is a witnessed fact.</p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            A witness wallet you trust committed, no later than the block its record landed in, that the URL returned a file
            with exactly this fingerprint. Trust comes from the wallet that created the record, which cannot be forged.
          </p>
        </Reveal>
        <Reveal className="reveal border-t border-dashed border-ink-3 pt-5 lg:col-span-4 lg:col-start-9" delay={180}>
          <p className="serif text-[26px] leading-snug">Absence is not an accusation.</p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            No matching record means only that no trusted witness recorded this exact file. It is <em>not</em> evidence that
            the document is fake: it may never have been witnessed, or it may have been re-saved or compressed. Check the
            official source.
          </p>
        </Reveal>
      </section>

      <Reveal className="reveal mt-28 flex flex-col items-start gap-6 border-y border-rule py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="serif max-w-xl text-[clamp(1.6rem,3vw,2.25rem)] leading-tight tracking-[-0.015em]">
          Hold a notice up to the record.
        </p>
        <Link href="/verify/" className="btn btn-solid">Examine a document <span className="arrow" aria-hidden>→</span></Link>
      </Reveal>
    </div>
  )
}
