"use client";

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/platform-auth/csrf");
  const data = await res.json();
  return data.csrfToken as string;
}

export async function platformSignIn(
  email: string,
  password: string
): Promise<{ ok: boolean }> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/platform-auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: "/platform",
      json: "true",
    }),
  });

  if (!res.ok) return { ok: false };

  const data = await res.json().catch(() => null);
  if (!data?.url) return { ok: false };

  const redirectUrl = new URL(data.url, window.location.origin);
  const hasError = redirectUrl.searchParams.has("error");
  return { ok: !hasError };
}

export async function platformSignOut(): Promise<void> {
  const csrfToken = await getCsrfToken();
  await fetch("/api/platform-auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, callbackUrl: "/platform/login", json: "true" }),
  });
  window.location.href = "/platform/login";
}