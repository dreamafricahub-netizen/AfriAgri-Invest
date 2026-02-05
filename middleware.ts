import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/auth/login",
    },
});

export const config = {
    // Protect all routes except those starting with /auth, /api, /_next, /static, /favicon.ico
    // Actually, we want to protect dashboard pages.
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - auth (Authentication routes like login/register)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        "/((?!api|auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
