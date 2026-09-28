import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "shreekari_session";

function sameValue(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expectedUser = process.env.BIRTHDAY_APP_USER || "";
  const expectedPassword = process.env.BIRTHDAY_APP_PASSWORD || "";
  const sessionToken = process.env.BIRTHDAY_APP_SESSION_TOKEN || "";

  if (!expectedUser || !expectedPassword || !sessionToken) {
    return NextResponse.json(
      { error: "Login is not configured. Please contact the app administrator." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!sameValue(username, expectedUser) || !sameValue(password, expectedPassword)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
