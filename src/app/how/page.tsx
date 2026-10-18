import { EXPLORER, PROJECT, WITNESSES } from "@/lib/config"

export default function How() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed text-stone-700">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">How Sakshi works</h1>
      <section className="space-y-2">
        <h2 className="font-medium text-stone-900">1. Witnesses record what a URL served</h2>
        <p>
          A witness is a small CLI (<code className="mono">scripts/witness.ts</code>) that anyone can run with their own
          wallet. It fetches each notice PDF, computes its SHA-256, compares it with its own latest record, and writes one
          Arkiv transaction per run: a <code className="mono">seen</code>, <code className="mono">changed</code> or{" "}
          <code className="mono">gone</code> observation for anything new, a run summary, and a Lifetime Extension for records
          it saw again.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium text-stone-900">2. You check a file without uploading it</h2>
        <p>
          Your browser hashes the PDF locally. The site asks Arkiv for observations with that exact{" "}
          <code className="mono">doc_sha256</code>, keeps only those created by witness wallets you trust (the immutable{" "}
          <code className="mono">$creator</code>, which nobody can fake), and reads each witness&apos;s timeline for that URL.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium text-stone-900">3. Verify without this website</h2>
        <pre className="mono overflow-x-auto rounded bg-stone-900 p-3 text-xs text-stone-100">{`git clone https://github.com/bhavya-jpg/sakshi && cd sakshi && npm i
npx tsx scripts/verify.ts path/to/notice.pdf`}</pre>
        <p>This reads the public Tiramisu RPC directly. No key, no Sakshi server.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium text-stone-900">What it proves, and what it does not</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Proves: witness wallet W committed, no later than the block time, that URL U returned bytes with hash H.</li>
          <li>Does not prove that W fetched honestly (there is no TLS proof yet), or that the official site was not itself compromised.</li>
          <li>A missing record is never evidence that a document is fake.</li>
          <li>In this hackathon build, every witness is operated by the Sakshi team. Anyone can run another.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium text-stone-900">Witness wallets</h2>
        <ul className="space-y-1">
          {WITNESSES.map((w) => (
            <li key={w.address}>{w.label}: <a className="mono break-all underline" href={`${EXPLORER}/address/${w.address}`}>{w.address}</a></li>
          ))}
        </ul>
        <p>All records use <code className="mono">project = &quot;{PROJECT}&quot;</code>. The full schema is in <code className="mono">/arkiv/schema.md</code>.</p>
      </section>
    </article>
  )
}
