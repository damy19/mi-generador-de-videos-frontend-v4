import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
const next = searchParams.get("next") ?? "/";

  // Usamos NEXT_PUBLIC_SITE_URL como base confiable. Si no existe, cae en el origin del request.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // El método setAll puede ser llamado desde Server Components
              // donde no siempre se pueden modificar las cookies.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Forzamos la redirección exacta al dominio con www (o tu baseurl configurada)
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

// Si algo falla, redirige a la raíz del dominio base confiable
  return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
}


