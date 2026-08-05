"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../../lib/api";
import { saveAuthToken } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await registerUser({ nombre, email, password });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

if (response.token) {
      saveAuthToken(response.token);
      router.push("/");
      return;
    }

    setError("Ocurrió un error inesperado. Intenta nuevamente.");
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-10 space-y-3 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              Registro</p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Crea tu cuenta</h1>
            <p className="text-sm text-zinc-400">Regístrate y comienza a generar videos con tokens.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Nombre</label>
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre completo"
                className="w-full rounded-3xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-blue-400/80 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nombre@ejemplo.com"
                className="w-full rounded-3xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-blue-400/80 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-3xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none transition focus:border-blue-400/80 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
¿Ya tenés cuenta? <Link href="/" className="text-blue-400 hover:text-blue-300">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
