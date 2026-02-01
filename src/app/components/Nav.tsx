"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const isSimple = pathname === "/interes-simple";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Calculadora de intereses
        </h1>
        <nav
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-700/60 bg-slate-800/60 p-1 sm:w-auto"
          role="navigation"
          aria-label="Tipo de interés"
        >
          <Link
            href="/"
            className={`relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              !isSimple
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : "text-slate-400 hover:bg-slate-700/70 hover:text-slate-200"
            }`}
            aria-current={!isSimple ? "page" : undefined}
          >
            Interés compuesto
          </Link>
          <Link
            href="/interes-simple"
            className={`relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              isSimple
                ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-900/40"
                : "text-slate-400 hover:bg-slate-700/70 hover:text-slate-200"
            }`}
            aria-current={isSimple ? "page" : undefined}
          >
            Interés simple
          </Link>
        </nav>
      </div>
    </header>
  );
}
