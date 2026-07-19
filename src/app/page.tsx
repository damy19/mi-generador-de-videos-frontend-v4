"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redirige al callback de autenticación (dominio dinámico)
        redirectTo: `${window.location.origin}/auth/callback`,

      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#02040a] text-white flex items-center justify-center">
      
      {/* CONTENEDOR DE VIDEOS DE FONDO */}
      <div className="absolute inset-0 z-0 grid grid-cols-1 md:grid-cols-2 gap-0 w-full h-full opacity-95 pointer-events-none">
        {/* Video Izquierdo */}
        <div className="relative w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            {/* Cambiá el nombre si tus videos en la carpeta public se llaman distinto */}
            <source src="/video1.mp4" type="video/mp4" />
          </video>
          {/* Degradado oscuro para integrar el video izquierdo */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-[#02040a]" />
        </div>

        {/* Video Derecho */}
        <div className="relative w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video2.mp4" type="video/mp4" />
          </video>
          {/* Degradado oscuro para integrar el video derecho */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-[#02040a]" />
        </div>
      </div>

      {/* Capa de degrade general para asegurar buen contraste y lectura del texto */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-[#02040a]/70 to-[#02040a] pointer-events-none" />

      {/* CONTENIDO PRINCIPAL (LOGIN CARD) */}
      <div className="relative z-20 w-full max-w-xl px-6 py-10">
        <div className="rounded-[2.5rem] border border-white/10 bg-[#070b19]/60 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          
          <div className="mb-10 space-y-4 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Generador de Videos con IA
            </p>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-300">
              Bienvenido
            </h1>
            
            <p className="text-base text-zinc-300">
              Crea contenido impactante en segundos. Generá hasta <span className="text-cyan-400 font-semibold">800 videos</span> con el plan <span className="text-violet-400 font-semibold">Business</span>.
            </p>
          </div>

          {/* Botón único de acceso */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                {/* Spinner simple de carga */}
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirigiendo...
              </span>
            ) : (
              "Comenzar con Google"
            )}
          </button>

          {/* Alertas de error */}
          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
              {error}
            </div>
          ) : null}
          
        </div>
      </div>
    </div>
  );
}
