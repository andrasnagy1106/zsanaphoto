"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PhotoOrderPinDialog } from "./PhotoOrderPinDialog";

const SERVICE_LINKS = [
  { href: "/szolgaltatasok", label: "Összes szolgáltatás" },
  { href: "/csaladi-fotozas", label: "Családi fotózás" },
  { href: "/bolcsodei-es-ovodai-fotozas", label: "Bölcsődei & óvodai fotózás" },
  { href: "/iskolai-fotozas", label: "Iskolai fotózás" },
  { href: "/szezonalis-fotozas", label: "Szezonális fotózás" },
];

const NAV_LINKS = [
  { href: "/galeria", label: "Galéria" },
  { href: "/rolam", label: "Rólam" },
  { href: "/kapcsolat", label: "Kapcsolat" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement>(null);

  const isServicesActive = SERVICE_LINKS.some((link) => link.href === pathname);

  useEffect(() => {
    if (!servicesOpen) return;

    function closeServicesMenuOnOutsideClick(event: MouseEvent) {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    }

    document.addEventListener("mousedown", closeServicesMenuOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeServicesMenuOnOutsideClick);
  }, [servicesOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Image
            src="/zsana-logo.png"
            alt="ZsaNa Photo"
            width={220}
            height={44}
            priority
            style={{ height: "44px", width: "auto" }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Fő navigáció">
          <div
            className="relative"
            ref={servicesMenuRef}
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link
              href="/szolgaltatasok"
              onClick={() => setServicesOpen(false)}
              aria-expanded={servicesOpen}
              className={cn(
                "flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:text-accent",
                isServicesActive ? "text-accent" : "text-foreground/80",
              )}
            >
              Szolgáltatások
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {servicesOpen ? (
              <div className="absolute left-0 top-full pt-3">
                <ul className="w-56 rounded-lg border border-border bg-background py-2 shadow-lg">
                  {SERVICE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setServicesOpen(false)}
                        className={cn(
                          "block px-4 py-2.5 text-sm font-medium hover:bg-muted hover:text-accent",
                          pathname === link.href ? "text-accent" : "text-foreground/80",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-foreground/80",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PhotoOrderPinDialog />
          <Link
            href="/idopontfoglalas"
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Időpontot foglalok
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground"
          aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Mobil navigáció"
          className="lg:hidden border-t border-border bg-background px-4 pb-4 pt-2"
        >
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => setMobileServicesOpen((open) => !open)}
                aria-expanded={mobileServicesOpen}
                className={cn(
                  "flex w-full min-h-11 items-center justify-between rounded-md px-3 py-2.5 text-base font-medium",
                  isServicesActive ? "bg-muted text-accent" : "text-foreground/80",
                )}
              >
                Szolgáltatások
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className={cn("transition-transform", mobileServicesOpen ? "rotate-180" : "")}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {mobileServicesOpen ? (
                <ul className="mt-1 flex flex-col gap-1 pl-4">
                  {SERVICE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "block min-h-11 rounded-md px-3 py-2.5 text-sm font-medium",
                          pathname === link.href ? "bg-muted text-accent" : "text-foreground/70",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block min-h-11 rounded-md px-3 py-2.5 text-base font-medium",
                    pathname === link.href ? "bg-muted text-accent" : "text-foreground/80",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <PhotoOrderPinDialog mobile onNavigate={() => setMenuOpen(false)} />
            </li>
            <li className="pt-2">
              <Link
                href="/idopontfoglalas"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-base font-semibold text-white"
              >
                Időpontot foglalok
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
