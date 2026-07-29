import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  // protege tudo em /admin, exceto a própria página de login
  matcher: ["/admin/((?!login).*)"],
};