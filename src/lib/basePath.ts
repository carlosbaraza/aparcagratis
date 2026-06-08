/**
 * Base path the app is served under. Empty for local dev or root deployments
 * (custom domain / `<user>.github.io`); set to `/<repo>` for GitHub Pages project
 * sites via the NEXT_PUBLIC_BASE_PATH build-time env var.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a public asset path (e.g. "/data/x.geojson") with the base path. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
