"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/app/actions/auth-actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Áttekintés" },
  { href: "/admin/bookings", label: "Foglalások" },
  { href: "/admin/photo-orders", label: "Fotórendelések" },
  { href: "/admin/inquiries", label: "Érdeklődések" },
  { href: "/admin/services", label: "Szolgáltatások" },
  { href: "/admin/availability", label: "Elérhetőség" },
  { href: "/admin/blocked-periods", label: "Blokkolt időszakok" },
  { href: "/admin/settings", label: "Beállítások" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block min-h-11 rounded-md px-3 py-2.5 text-sm font-medium",
                isActive ? "bg-accent/10 text-accent" : "text-foreground/70 hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <span className="font-display text-lg text-foreground">Zsana Photo Admin</span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-md"
          aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen ? (
        <div className="lg:hidden border-b border-border bg-white px-4 py-3">
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          <form action={logoutAction} className="mt-2">
            <button type="submit" className="min-h-11 w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-muted">
              Kijelentkezés
            </button>
          </form>
        </div>
      ) : null}

      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-white lg:px-4 lg:py-6">
        <p className="px-3 font-display text-lg text-foreground">Zsana Photo Admin</p>
        <p className="px-3 pb-4 text-xs text-foreground/50">{adminName}</p>
        <nav className="flex-1">
          <NavLinks pathname={pathname} />
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="min-h-11 w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/70 hover:bg-muted">
            Kijelentkezés
          </button>
        </form>
      </aside>
    </>
  );
}
