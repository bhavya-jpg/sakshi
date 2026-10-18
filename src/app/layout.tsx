import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sakshi · independent witness for public notices",
  description:
    "Check whether the exact PDF you received was served by an official notice URL, and when. Records live on Arkiv (Tiramisu testnet).",
};

const nav = [
  { href: "/", label: "Verify a PDF" },
  { href: "/timeline", label: "URL timeline" },
  { href: "/board", label: "Demo board" },
  { href: "/how", label: "How it works" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">Sakshi</span>
              <span className="text-stone-500 text-sm">साक्षी · witness</span>
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-stone-900">{n.label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">{children}</main>
        <footer className="border-t border-stone-200 text-xs text-stone-500">
          <div className="mx-auto max-w-4xl px-4 py-4 flex flex-wrap gap-x-4 gap-y-1">
            <span>Records are read from Arkiv, the Web3 database (Tiramisu testnet).</span>
            <span>This site holds no keys and cannot write records.</span>
            <a className="underline" href="https://github.com/bhavya-jpg/sakshi">Source (MIT)</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
