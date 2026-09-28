import { ApiError } from "@/lib/apiClientError";

/**
 * Shared handler for store-action rejections that may be a 401 (session
 * missing/expired). Full browser navigation is required: /auth/github is a
 * route handler that itself redirects to GitHub's OAuth page, not a
 * client-routable Next.js page.
 */
export function redirectToLoginOn401(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/github";
  }
}
