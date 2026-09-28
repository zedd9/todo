import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/todos", label: "할일" },
  { href: "/weekly", label: "주간 계획" },
  { href: "/goals", label: "1년 목표" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-black/10 dark:border-white/10 p-4">
      <nav className="flex flex-col gap-2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
