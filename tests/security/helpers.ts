import { request as pwRequest, APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

export async function createAuthedContext(email: string, password: string): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });

  const csrfRes = await ctx.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  const loginRes = await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, json: "true" },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  const body = await loginRes.json().catch(() => null);

  if (!loginRes.ok() || body?.url?.includes("error")) {
    throw new Error(`Falha ao logar como ${email}: ${loginRes.status()} ${JSON.stringify(body)}`);
  }
  return ctx;
}