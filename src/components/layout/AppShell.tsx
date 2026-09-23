"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell-bg min-h-screen">
      <div
        className={
          "fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden " +
          (open ? "" : "pointer-events-none opacity-0")
        }
        onClick={() => setOpen(false)}
      >
        <div
          className={
            "h-full w-72 border-r border-white/10 bg-[#060b16] p-3 transition-transform " +
            (open ? "translate-x-0" : "-translate-x-full")
          }
          onClick={(event) => event.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>

      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header onMenu={() => setOpen(true)} />
          <main className="space-bg min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
