"use client";

import { useEffect, useState } from "react";

interface CurrentUser {
  username: string;
  avatarUrl?: string;
}

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setChecked(true);
          }
          return;
        }
        const data: CurrentUser = await res.json();
        if (!cancelled) {
          setUser(data);
          setChecked(true);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setChecked(true);
        }
      }
    }

    loadUser();

    // Re-check on tab focus/visibility change and on bfcache restore
    // (switching back to a tab that was open before a logout/login elsewhere
    // does NOT re-mount this component or issue any network request by
    // default, so the header would otherwise show stale auth state).
    function handleVisibility() {
      if (document.visibilityState === "visible") loadUser();
    }
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) loadUser();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", loadUser);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", loadUser);
    };
  }, []);

  return (
    <header className="h-14 shrink-0 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4">
      <h1 className="text-base font-semibold">할일 + 계획 관리</h1>
      {checked && (
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium">{user.username}</span>
              <a
                href="/auth/logout"
                className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                로그아웃
              </a>
            </>
          ) : (
            <a
              href="/auth/github"
              className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              GitHub로 로그인
            </a>
          )}
        </div>
      )}
    </header>
  );
}
