import { NextRequest, NextResponse } from "next/server";

// The real access code lives ONLY in Vercel's Environment Variables — never in this file, never in git.
// Set OWNER_ACCESS_CODE under Vercel → Project Settings → Environment Variables.
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const correctCode = process.env.OWNER_ACCESS_CODE;

  if (!correctCode) {
    return NextResponse.json({ error: "Access code not configured on server" }, { status: 500 });
  }

  if (code !== correctCode) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  // httpOnly cookie: cannot be read or stolen via client-side JavaScript
  res.cookies.set("owner_session", correctCode, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
