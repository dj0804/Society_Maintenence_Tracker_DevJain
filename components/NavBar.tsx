"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";

const RESIDENT_LINKS = [
  { href: "/complaints", label: "My Complaints" },
  { href: "/complaints/new", label: "Raise Complaint" },
  { href: "/notices", label: "Notice Board" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/settings", label: "Settings" },
];

export default function NavBar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = role === "ADMIN" ? ADMIN_LINKS : RESIDENT_LINKS;

  // The dashboard link must match exactly, or it stays active on every /admin page.
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={role === "ADMIN" ? "/admin" : "/complaints"} className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-ink text-sm font-semibold text-white">
            SM
          </span>
          <span className="hidden text-sm font-semibold sm:block">Society Maintenance Tracker</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                isActive(link.href) ? "bg-brand-soft font-medium text-brand" : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-tight font-medium">{name}</p>
            <p className="text-xs leading-tight text-muted">{role === "ADMIN" ? "Administrator" : "Resident"}</p>
          </div>
          <button onClick={logout} className="btn-secondary px-3 py-1.5 text-xs">
            Sign out
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="btn-secondary px-2.5 py-1.5 md:hidden"
          >
            <span className="block h-px w-4 bg-current shadow-[0_4px_0_currentColor,0_-4px_0_currentColor]" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm ${
                isActive(link.href) ? "bg-brand-soft font-medium text-brand" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
