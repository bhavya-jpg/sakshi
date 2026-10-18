import Link from "next/link"
import { Bento } from "@/components/landing/Bento"
import { FlowDiagram } from "@/components/landing/FlowDiagram"
import { HeroDemo } from "@/components/landing/HeroDemo"
import { LiveStats, RecordFeed } from "@/components/landing/Live"
import { Reveal } from "@/components/Reveal"

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-forest-2" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 8.5l3 3 7-7" /></svg>
)

const problems = [
  { n: "01", t: "Pages change quietly", d: "A deadline moves or a fee changes, and the old version is simply replaced at the same URL." },
  { n: "02", t: "Files disappear", d: "Notices are withdrawn or sites go down, exactly when someone needs to prove what was said." },
  { n: "03", t: "Archives can be blocked", d: "India blocked the Wayback Machine in 2017. One operator is one point of failure." },
]

const verdicts = [
  { k: "Served", hi: "उपलब्ध", c: "text-forest", dot: "bg-forest-2", d: "A trusted witness saw this exact file at the URL and has not seen it change." },
  { k: "Replaced", hi: "बदला गया", c: "text-ochre", dot: "bg-[#e0a33a]", d: "This file was served, then the same URL started serving a different one." },
  { k: "Removed", hi: "हटाया गया", c: "text-oxblood", dot: "bg-oxblood", d: "This file was served, then the URL stopped serving anything." },
  { k: "No matching record", hi: "कोई रिकॉर्ड नहीं", c: "text-ink-2", dot: "border border-ink-3", d: "No trusted witness recorded it. Not evidence of a fake. Check the official source." },
]

const faq = [
  ["Does Sakshi tell me if a document is fake?", "No. It tells you what independent witnesses recorded: whether this exact file was served by a URL, and when. A missing record only means nobody you trust recorded it."],
  ["Is my PDF uploaded anywhere?", "No. Your browser computes the SHA-256 locally and sends only that fingerprint in a public query. The file never leaves your device."],
  ["Who are the witnesses?", "Anyone who runs the open-source witness with their own wallet. In this hackathon build, the one active witness is operated by the Sakshi team, and you can untick it."],
  ["Why Arkiv instead of a normal database?", "Records are readonly, timestamped by the chain, attributed to the wallet that wrote them, and queryable by anyone without our server. We cannot quietly edit or delete them."],
  ["Is the demo board a real government site?", "No. It is a clearly labelled mock publisher with synthetic notices, so anyone can reproduce a change and a removal end to end."],
]

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative -mt-16 overflow-hidden bg-night pb-24 pt-32 text-white sm:pt-36">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/how/" className="fade-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-3 text-[12.5px] text-white/75 hover:border-white/25">
              <span className="mono rounded-full bg-forest-2/15 px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-forest-2">Live</span>
              Records on Arkiv · Tiramisu testnet <span aria-hidden>→</span>
            </Link>
            <h1 className="display mt-7 text-[clamp(2.9rem,7.4vw,5.6rem)]">
              <span className="line-mask"><span>Proof of what was</span></span>
              <span className="line-mask"><span style={{ animationDelay: "110ms" }}><em className="text-forest-2">actually</em> published.</span></span>
            </h1>
            <p className="fade-in mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/65" style={{ animationDelay: "350ms" }}>
              Check a forwarded notice PDF against independent witness records: which exact file an official URL served, and
              when it changed or disappeared.
            </p>
            <div className="fade-in mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "500ms" }}>
              <Link href="/verify/" className="btn btn-green">Verify a PDF <span className="arrow" aria-hidden>→</span></Link>
              <Link href="/board/" className="btn btn-ghost-night">See a notice change</Link>
            </div>
            <ul className="fade-in mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-white/55" style={{ animationDelay: "650ms" }}>
              {["Nothing uploaded", "Readonly public records", "Open source · MIT", "No server to trust"].map((x) => (
                <li key={x} className="flex items-center gap-1.5"><Check />{x}</li>
              ))}
            </ul>
          </div>
          <div className="fade-in mx-auto mt-16 max-w-5xl" style={{ animationDelay: "750ms" }}>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ── Live proof strip ── */}
      <section className="relative mx-auto -mt-10 max-w-6xl px-4 sm:px-8">
        <LiveStats />
      </section>

      {/* ── Problem ── */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="reveal lg:col-span-5">
            <p className="eyebrow">The problem</p>
            <h2 className="h2 mt-4">A PDF arrives on WhatsApp. <em className="text-forest">Is it what the board published?</em></h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-2">
              Recruitment and exam candidates act on forwarded notices. &ldquo;Check the official site&rdquo; only works if the site
              still shows what it showed before.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
            {problems.map((p, i) => (
              <Reveal key={p.n} className="reveal card p-5" delay={i * 100}>
                <p className="mono text-[11px] text-ink-3">{p.n}</p>
                <p className="mt-8 text-[17px] font-semibold tracking-[-0.025em]">{p.t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative mt-28 border-y border-rule bg-sheet py-24">
        <div className="grid-bg-light pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
          <Reveal className="reveal mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="h2 mt-4">Witnesses write. <em className="text-forest">Anyone reads.</em></h2>
            <p className="mt-4 text-[16px] text-ink-2">Two independent paths meet at one public record.</p>
          </Reveal>
          <Reveal className="reveal mt-14"><FlowDiagram /></Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 text-[14px] sm:grid-cols-3">
            {[
              ["Witness runs", "Fetch each notice URL, hash the bytes, compare with its last record, write one atomic batch."],
              ["Arkiv keeps it", "Readonly entities with the URL, hash, fetch time and HTTP status, attributed to the witness wallet."],
              ["You check", "Your browser hashes your copy and asks Arkiv who saw that exact file, where, and when."],
            ].map(([t, d], i) => (
              <Reveal key={t} className="reveal flex gap-4" delay={i * 100}>
                <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] text-white">{i + 1}</span>
                <div><p className="font-semibold tracking-[-0.02em]">{t}</p><p className="mt-1 leading-relaxed text-ink-2">{d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <Reveal className="reveal max-w-2xl">
          <p className="eyebrow">Why you can trust a result</p>
          <h2 className="h2 mt-4">Built so that <em className="text-forest">nobody</em> has to be taken at their word, including us.</h2>
        </Reveal>
        <Reveal className="reveal mt-12"><Bento /></Reveal>
      </section>

      {/* ── Live record ── */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <Reveal className="reveal lg:col-span-4">
            <p className="eyebrow"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-forest-2 text-forest-2" />The public record</p>
            <h2 className="h2 mt-4">Live from <em className="text-forest">Tiramisu.</em></h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              These rows are queried from Arkiv by your browser as this page loads. Each one links to its URL timeline.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/timeline/" className="btn">Open timeline</Link>
              <a href="https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/schema.md" className="btn">Read the schema</a>
            </div>
          </Reveal>
          <Reveal className="reveal lg:col-span-8" delay={120}><RecordFeed /></Reveal>
        </div>
      </section>

      {/* ── Reading a result ── */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <Reveal className="reveal max-w-2xl">
          <p className="eyebrow">Reading a result</p>
          <h2 className="h2 mt-4">Four answers. <em className="text-forest">None of them guesses.</em></h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {verdicts.map((v, i) => (
            <Reveal key={v.k} className={`reveal p-5 ${i === 3 ? "rounded-[14px] border border-dashed border-ink-3/60" : "card"}`} delay={i * 90}>
              <span className={`block h-2.5 w-2.5 rounded-full ${v.dot}`} />
              <p className={`mt-6 text-[20px] font-semibold tracking-[-0.03em] ${v.c}`}>{v.k}</p>
              <p className="serif text-[15px] italic text-ink-3">{v.hi}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{v.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="reveal lg:col-span-4">
            <p className="eyebrow">Questions</p>
            <h2 className="h2 mt-4">Plainly <em className="text-forest">answered.</em></h2>
          </Reveal>
          <div className="divide-y divide-rule border-y border-rule lg:col-span-8">
            {faq.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex items-center justify-between gap-6 py-5 text-[16px] font-medium tracking-[-0.015em]">
                  {q}<span className="chev mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule text-[15px]">+</span>
                </summary>
                <div className="details-body"><div className="overflow-hidden"><p className="max-w-2xl pb-5 text-[15px] leading-relaxed text-ink-2">{a}</p></div></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-8">
        <Reveal className="reveal relative overflow-hidden rounded-3xl bg-night px-6 py-16 text-center text-white sm:px-12">
          <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
          <div className="glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="h2 mx-auto max-w-2xl">Hold a notice up to <em className="text-forest-2">the record.</em></h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-white/60">Drop a PDF. Get an answer in seconds, from data nobody can quietly change.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/verify/" className="btn btn-green">Verify a PDF <span className="arrow" aria-hidden>→</span></Link>
              <a href="https://github.com/bhavya-jpg/sakshi" className="btn btn-ghost-night">Run your own witness</a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
