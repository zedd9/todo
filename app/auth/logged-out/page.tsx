import LandingPage from "@/components/landing/LandingPage";

/**
 * Landing spot for /auth/logout. This route is intentionally NOT covered by
 * proxy.ts's auth gate: if logout redirected straight to a gated page (like
 * `/`), the missing session cookie would immediately bounce the browser back
 * through /auth/github, and if the browser still has an active GitHub
 * session, GitHub silently re-authorizes without showing a prompt — logout
 * would appear to do nothing. Landing here first makes the logout visible
 * and leaves re-login to an explicit click, using the same login screen the
 * logged-out home page ("/") shows.
 */
export default function LoggedOutPage() {
  return <LandingPage />;
}
