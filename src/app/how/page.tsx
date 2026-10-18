import { Reveal } from "@/components/Reveal"
import { EXPLORER, PROJECT, WITNESSES } from "@/lib/config"

const sections = [
  {
    n: "I", title: "Witnesses record what a URL served",
    body: (
      <>A witness is a small command-line program (<code className="mono text-[13px]">scripts/witness.ts</code>) that anyone can run with
        their own wallet. It fetches each notice PDF, computes its SHA-256, compares it with its own latest record, and writes one
        Arkiv transaction per run: a <code className="mono text-[13px]">seen</code>, <code className="mono text-[13px]">changed</code> or{" "}
        <code className="mono text-[13px]">gone</code> observation for anything new, a run summary, and a Lifetime Extension for records it saw again.</>
    ),
  },
  {
    n: "II", title: "You check a file without uploading it",
    body: (
      <>Your browser fingerprints the PDF locally, asks Arkiv for observations with that exact <code className="mono text-[13px]">doc_sha256</code>,
        keeps only records created by witness wallets you trust (the immutable <code className="mono text-[13px]">$creator</code>), and reads each
        witness&apos;s timeline for that URL.</>
    ),
  },
  {
    n: "III", title: "Verify without this website",
    body: (
      <>
        <pre className="mono overflow-x-auto border border-ink bg-ink p-4 text-[12px] leading-relaxed text-sheet">{`git clone https://github.com/bhavya-jpg/sakshi && cd sakshi && npm i
npx tsx scripts/verify.ts path/to/notice.pdf`}</pre>
        <p className="mt-3">This reads the public Tiramisu RPC directly. No key, no Sakshi server.</p>
      </>
    ),
  },
]

export default function How() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-16">
      <header className="pb-14">
        <p className="kicker fade-in">Nº 04 · Method</p>
        <h1 className="display mt-4 max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)]">
          <span className="line-mask"><span>How a trace</span></span>
          <span className="line-mask"><span style={{ animationDelay: "100ms" }}>is <em className="italic text-forest">kept.</em></span></span>
        </h1>
      </header>

      <div className="divide-y divide-rule border-y border-ink">
        {sections.map((s) => (
          <Reveal key={s.n} className="reveal grid grid-cols-1 gap-4 py-10 lg:grid-cols-12">
            <p className="kicker lg:col-span-1">{s.n}</p>
            <h2 className="serif text-[28px] leading-tight tracking-[-0.015em] lg:col-span-4">{s.title}</h2>
            <div className="text-[15px] leading-relaxed text-ink-2 lg:col-span-6 lg:col-start-7">{s.body}</div>
          </Reveal>
        ))}
      </div>

      <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <Reveal className="reveal border-t border-forest pt-5 lg:col-span-5">
          <h2 className="serif text-[26px]">What a record proves</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            That witness wallet W committed, no later than the block it landed in, that URL U returned bytes with SHA-256 H.
          </p>
        </Reveal>
        <Reveal className="reveal border-t border-dashed border-ink-3 pt-5 lg:col-span-6 lg:col-start-7" delay={120}>
          <h2 className="serif text-[26px]">What it does not prove</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-2">
            <li>That W fetched honestly. There is no TLS proof yet.</li>
            <li>That the official site was not itself compromised.</li>
            <li>Anything about a missing record: absence is never evidence that a document is fake.</li>
            <li>Independence, in this hackathon build: every witness here is operated by the Sakshi team. Anyone can run another.</li>
          </ul>
        </Reveal>
      </section>

      <section className="mt-20 border-t border-ink pt-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <h2 className="kicker text-ink! lg:col-span-3">Witness wallets</h2>
          <ul className="divide-y divide-rule border-y border-rule lg:col-span-9">
            {WITNESSES.map((w) => (
              <li key={w.address} className="flex flex-col gap-1 py-3 text-[14px] sm:flex-row sm:items-baseline sm:justify-between">
                <span>{w.label}</span>
                <a className="mono break-all text-[12px] ink-link-static" href={`${EXPLORER}/address/${w.address}`}>{w.address}</a>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-[13px] text-ink-2 lg:pl-[25%]">
          All records use <code className="mono">project = &quot;{PROJECT}&quot;</code>. The full data contract is in{" "}
          <a className="ink-link-static" href="https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/schema.md">/arkiv/schema.md</a>.
        </p>
      </section>
    </div>
  )
}
