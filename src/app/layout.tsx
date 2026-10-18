import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Sakshi · The truth leaves a trace",
  description:
    "Check whether the exact PDF you received was served by a notice URL, and when, against independently recorded observations on Arkiv (Tiramisu testnet).",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased min-h-screen flex flex-col`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:bg-sheet focus:px-3 focus:py-1">Skip to content</a>
        <header className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <div className="flex items-center justify-between border-b border-rule py-1.5 text-[10px] mono uppercase tracking-[0.14em] text-ink-3">
              <span>An independent witness archive</span>
              <span className="hidden sm:inline">Arkiv · Tiramisu testnet · read-only</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 py-4">
              <Link href="/" className="group flex items-baseline gap-3" aria-label="Sakshi, home">
                <span className="serif text-[28px] leading-none tracking-[-0.02em]">Sakshi</span>
                <span className="serif text-[15px] italic text-ink-3 transition-colors group-hover:text-forest">साक्षी</span>
              </Link>
              <Nav />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="mt-24 border-t border-rule">
          <div className="mx-auto grid grid-cols-1 max-w-6xl gap-6 px-4 py-10 text-[13px] text-ink-2 sm:grid-cols-12 sm:px-8">
            <p className="serif text-xl leading-snug text-ink sm:col-span-5">
              A record of what was published, kept by witnesses, readable by anyone.
            </p>
            <div className="space-y-1 sm:col-span-4 sm:col-start-7">
              <p className="kicker">Colophon</p>
              <p>Your browser reads records directly from Arkiv, the Web3 database. There is no Sakshi server, and this site holds no keys.</p>
            </div>
            <div className="space-y-1 sm:col-span-2 sm:col-start-11">
              <p className="kicker">Source</p>
              <a className="ink-link-static" href="https://github.com/bhavya-jpg/sakshi">GitHub · MIT</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
