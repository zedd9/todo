import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import Dashboard from "@/components/dashboard/Dashboard";
import LandingPage from "@/components/landing/LandingPage";
import { getSessionUser } from "@/lib/session";

// Server-rendered auth check (same session lookup api/auth/me uses) instead
// of a client-side fetch: "/" is no longer behind proxy.ts's redirect (see
// proxy.ts), so it must decide landing-vs-dashboard before any HTML reaches
// the browser — otherwise a logged-out visitor would briefly see a loading
// state, or worse, flash of dashboard content.
export default async function Home() {
  const cookieStore = await cookies();
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: cookieStore.toString() },
  });
  const sessionUser = await getSessionUser(request);

  return sessionUser ? <Dashboard /> : <LandingPage />;
}
