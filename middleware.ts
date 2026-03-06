import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type Role = "admin" | "tutor" | "client" | "student";

// Routes accessible to each role (and all authenticated users)
const ROLE_ROUTES: Record<Role, string[]> = {
  admin: ["/dashboard/admin"],
  tutor: ["/dashboard/tutor"],
  client: ["/dashboard/client"],
  student: ["/dashboard/student"],
};

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) {
      // withAuth already handles redirect to /login for unauthenticated requests
      return;
    }

    const role = (token.role as Role) ?? "student";

    // Redirect from generic /dashboard to the role-specific dashboard
    if (pathname === "/dashboard") {
      return NextResponse.redirect(
        new URL(`/dashboard/${role}`, req.url)
      );
    }

    // Prevent cross-role access: a tutor cannot visit /dashboard/admin, etc.
    for (const [r, paths] of Object.entries(ROLE_ROUTES) as [Role, string[]][]) {
      if (r === role) continue;
      if (paths.some((p) => pathname.startsWith(p))) {
        // Redirect to own dashboard instead of 403
        return NextResponse.redirect(
          new URL(`/dashboard/${role}`, req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Returning true here means "authenticated user may enter the middleware function above"
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Run middleware on all /dashboard/** and /api/** routes except auth & public endpoints
// Public: /api/auth/*, /api/consultations, /api/applications, /api/invites/*
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth|consultations|applications|invites).)*",
  ],
};
