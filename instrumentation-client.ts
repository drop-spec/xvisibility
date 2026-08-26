import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const missingVariable = !projectToken
  ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
  : !host
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : undefined;

if (missingVariable) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
}

if (projectToken && host) {
  posthog.init(projectToken, {
    api_host: host,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
