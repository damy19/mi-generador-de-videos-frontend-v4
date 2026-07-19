"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
  setError(null);
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Esto le dice a Google que mande el código al archivo que acabas de crear
      redirectTo: "https://stonestudio.cc/auth/callback",
    },
  });

  if (error) {
    setError(error.message);
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-10 space-y-3 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              Iniciar sesión
            </p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Bienvenido</h1>
            <p className="text-sm text-zinc-400">Accedé con tu cuenta de Google.</p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Redirigiendo..." : "Iniciar sesión con Google"}
          </button>

          {error ? (
            <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

