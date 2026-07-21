import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin");

  if (isAdminRoute) {
    const session = req.cookies.get("owner_session")?.value;
    const correctCode = process.env.OWNER_ACCESS_CODE;

    if (!session || session !== correctCode) {
      return NextResponse.redirect(new URL("/owner-access", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/admin/:path*",
};
