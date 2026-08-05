import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Toda la app vive en '/'. Si el usuario accede a /dashboard, redirigimos a /.
  if (request.nextUrl.pathname === "/dashboard" || request.nextUrl.pathname.startsWith("/dashboard/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // La página de login se muestra en la raíz, así que redirigimos a /.
  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Indicamos que este middleware solo corra en las rutas del dashboard, login y callback OAuth
export const config = {
  // Incluir el callback es clave para que Supabase/SSR pueda leer/escribir cookies de sesión
  matcher: ["/dashboard/:path*", "/login", "/auth/callback"],
};
