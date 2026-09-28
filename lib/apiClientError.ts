/** Thrown by store actions on a non-ok fetch response, carrying the HTTP
 * status so callers can distinguish e.g. a 401 (no/expired session) from
 * other failures. Shared across every slice so a single 401 handler
 * (lib/authRedirect.ts) can cover all of them. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
