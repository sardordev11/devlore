import "server-only";

// Dashboard data is still scoped to the seeded demo user.
const DEMO_USER_EMAIL = "demo@devlore.io";

export function demoUserFilter() {
  return { user: { email: DEMO_USER_EMAIL } };
}
