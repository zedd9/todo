"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/todos", label: "할일" },
  { href: "/weekly", label: "주간 계획" },
  { href: "/goals", label: "1년 목표" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-hairline bg-canvas p-4">
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-sm px-3 py-2 text-body-sm font-medium transition-colors ${
                isActive
                  ? "bg-surface-soft text-ink font-semibold"
                  : "text-muted hover:bg-surface-soft hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
