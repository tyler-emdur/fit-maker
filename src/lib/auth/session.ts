import { cookies } from "next/headers";

const SESSION_COOKIE = "fitmaker_session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is required.");
  }

  return secret;
}

export function createSessionToken() {
  return getSessionSecret();
}

export function verifySessionToken(token?: string | null) {
  return token === getSessionSecret();
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function isAuthenticated() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

