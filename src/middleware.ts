import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

// Validamos si hay un usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // Si ya está logueado e intenta ir al login, lo mandamos al dashboard
  if (request.nextUrl.pathname.startsWith("/login") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Nota: ya NO redirigimos /dashboard -> /login cuando no hay usuario.
  // El dashboard se muestra con el overlay de "Continuar con Google" superpuesto.

  return response;
}

// Indicamos que este middleware solo corra en las rutas del dashboard, login y callback OAuth
export const config = {
  // Incluir el callback es clave para que Supabase/SSR pueda leer/escribir cookies de sesión
  matcher: ["/dashboard/:path*", "/login", "/auth/callback"],
};

