"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "Problems" },
  { href: "/drill", label: "Drill" },
  { href: "/mock-interview", label: "Mock" },
  { href: "/info", label: "Info" },
];

export function Nav() {
  const pathname = usePathname();
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-foreground overflow-hidden whitespace-nowrap"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          <span className="inline-flex">
            <span>Neetcode</span>
            <span
              className="inline-block overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxWidth: logoHovered ? "20rem" : "0rem", opacity: logoHovered ? 1 : 0 }}
            >
              &nbsp;Spaced Repetition&nbsp;
            </span>
            <span>S</span>
            <span
              className="inline-block overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxWidth: logoHovered ? "10rem" : "0rem", opacity: logoHovered ? 1 : 0 }}
            >
              ystem
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                pathname.startsWith(href)
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
