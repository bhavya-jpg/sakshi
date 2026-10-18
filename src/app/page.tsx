import Link from "next/link"
import { Verify } from "@/components/Verify"
import { DemoBadge } from "@/components/VerdictView"

const samples = [
  { file: "demo-notice-1-v1.pdf", hint: "still on the demo board" },
  { file: "demo-notice-2-v1.pdf", hint: "original version, later edited" },
  { file: "demo-notice-2-v2.pdf", hint: "edited version (deadline moved)" },
  { file: "demo-notice-3-v1.pdf", hint: "later removed from the board" },
]

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Was this notice really published?</h1>
        <p className="max-w-2xl text-stone-600">
          Recruitment and exam notices get forwarded as PDFs on WhatsApp and Telegram. Sakshi witnesses record on Arkiv
          which exact file an official notice URL served, and when, including when the file changed or the URL
          disappeared. Drop a PDF to check it against those records.
        </p>
      </section>

      <section><Verify /></section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Try it with sample files <DemoBadge /></h2>
        <p className="mt-1 text-stone-600">
          These are synthetic notices from our clearly labelled <Link className="underline" href="/board">demo board</Link>, not real
          government documents. Download one, then drop it above.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {samples.map((s) => (
            <li key={s.file}>
              <a className="mono underline" href={`/samples/${s.file}`} download>{s.file}</a>
              <span className="text-stone-500"> · {s.hint}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="font-medium">What a match means</h2>
          <p className="mt-1 text-stone-600">
            A witness wallet you trust committed, no later than the block its record landed in, that the URL returned a file
            with exactly this SHA-256 hash.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="font-medium">What no match means</h2>
          <p className="mt-1 text-stone-600">
            Only that no trusted witness recorded this exact file. It is <strong>not</strong> proof that the document is
            fake: it may never have been witnessed, or it may have been re-saved or compressed. Always check the official site.
          </p>
        </div>
      </section>
    </div>
  )
}
