"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Coins,
  Crown,
  Download,
  Film,
  Gem,
  History,
  Loader2,
  LogOut,
  Monitor,
  Smartphone,
  Sparkles,
  Square,
  Zap,
} from "lucide-react";

import { clearAuthToken, getAuthToken } from "@/lib/auth";
import { API_BASE_URL, createVideo, getCurrentUser, getMyVideos } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type VideoItem = {
  id: number;
  temaOriginal: string;
  duracion: number;
  guion: string;
  urlAudio: string | null;
  urlVideo: string | null;
  falRequestId: string | null;
  estado: string;
  createdAt: string;
};

type StatusType = "idle" | "cociendo" | "completado" | "error";
type AspectRatio = "16:9" | "9:16" | "1:1";
type ModelType = "cheap" | "normal" | "full" | "premium";

const MODEL_TOKEN_COST: Record<ModelType, number> = {
  cheap: 1,
  normal: 6,
  full: 10,
  premium: 16,
};

const STREAM_PROXY_BASE = `${BACKEND_BASE_URL}/api/videos/stream`;

// Datos dummy SOLO para mostrar la estructura del dashboard cuando no hay sesión activa.
const DUMMY_VIDEOS: VideoItem[] = [
  {
    id: -1,
    temaOriginal: "Ciberpunk city at night",
    duracion: 5,
    guion: "",
    urlAudio: null,
    urlVideo: null,
    falRequestId: null,
    estado: "COMPLETADO",
    createdAt: new Date().toISOString(),
  },
  {
    id: -2,
    temaOriginal: "Aurora boreal time-lapse",
    duracion: 5,
    guion: "",
    urlAudio: null,
    urlVideo: null,
    falRequestId: null,
    estado: "PROCESANDO",
    createdAt: new Date().toISOString(),
  },
  {
    id: -3,
    temaOriginal: "Olas oceánicas futuristas",
    duracion: 5,
    guion: "",
    urlAudio: null,
    urlVideo: null,
    falRequestId: null,
    estado: "PENDIENTE",
    createdAt: new Date().toISOString(),
  },
];

export default function HomePage() {
  const router = useRouter();

  // Estados
  const [tokens, setTokens] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<StatusType>("idle");
  const [generatedVideoId, setGeneratedVideoId] = useState<number | null>(null);
  const [duracion, setDuracion] = useState(5);
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [selectedModel, setSelectedModel] = useState<ModelType>("cheap");

  const selectedModelTokenCost = MODEL_TOKEN_COST[selectedModel];

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Overlay de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const lastHandledCompletedIdRef = useRef<number | null>(null);

  const hasActiveGeneration = videos.some((v) => {
    const estado = String(v.estado || "").toUpperCase();
    return ["PENDIENTE", "EN_COLA", "PROCESANDO", "EN_PROGRESO", "COMPLETANDO"].includes(estado);
  });

  const canGenerate =
    !loading &&
    !loadingUser &&
    status !== "cociendo" &&
    !hasActiveGeneration &&
    typeof tokens === "number" &&
    tokens >= selectedModelTokenCost &&
    prompt.trim().length > 0;

  const reFetchTokens = async () => {
    const token = await getAuthToken();
    if (!token) return;

    const userResponse = await getCurrentUser(token);
    if (userResponse.error) return;

    const anyUserResponse = userResponse as unknown as {
      usuario?: { tokens?: number | null };
    };

    if (anyUserResponse.usuario) {
      setTokens(anyUserResponse.usuario.tokens ?? null);
    }
  };

  const loadVideos = async (token: string) => {
    setLoadingVideos(true);
    setVideoError(null);
    const response = await getMyVideos(token);
    setLoadingVideos(false);

    if (response.error) {
      console.error("❌ Error al traer historial de videos:", response.error);
      setVideoError(response.error);
      return;
    }

    const anyResponse = response as unknown as { videos?: VideoItem[] };
    if (anyResponse.videos) {
      setVideos(anyResponse.videos);
    }
  };

  const refreshVideos = async () => {
    const token = await getAuthToken();
    if (!token) return;

    const response = await getMyVideos(token);
    if (response.error) {
      return;
    }

    const anyResponse = response as unknown as { videos?: VideoItem[] };
    if (anyResponse.videos) {
      setVideos(anyResponse.videos);
    }
  };

  const hasPendingVideos = videos.some((video) => {
    const requestId = (video.falRequestId as string | null | undefined) ?? null;
    return typeof requestId === "string" && requestId.trim().length > 0;
  });

  const pendingFalVideoId = useMemo(() => {
    const pending = videos
      .filter((video) => {
        const requestId = (video.falRequestId as string | null | undefined) ?? null;
        return typeof requestId === "string" && requestId.trim().length > 0;
      })
      .map((v) => v.id);

    return pending.length ? pending[0] : null;
  }, [videos]);

  // Polling de estado de generación
  useEffect(() => {
    if (!pendingFalVideoId) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch(
          `${BACKEND_BASE_URL}/api/videos/${pendingFalVideoId}/status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;
        const data: unknown = await response.json();
        const video = (data as any)?.video;
        if (!video?.estado) return;

        const estado = String(video.estado).toUpperCase();

        if (["PENDIENTE", "EN_COLA", "PROCESANDO", "EN_PROGRESO", "COMPLETANDO"].includes(estado)) {
          return;
        }

        if (cancelled) return;

        setLoading(false);
        await Promise.all([refreshVideos(), reFetchTokens()]);

        if (estado === "COMPLETADO") {
          setStatus("completado");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Error en polling status:", err);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingFalVideoId]);

  // Loop automático para refrescar historial
  useEffect(() => {
    if (!hasPendingVideos) return;

    const intervalId = window.setInterval(() => {
      refreshVideos();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [hasPendingVideos]);

  // Auto-mostrado al completar
  useEffect(() => {
    if (!videos.length) return;

    const completed = videos.find(
      (v) => String(v.estado).toUpperCase() === "COMPLETADO" && v.urlVideo
    );

    if (!completed) return;

    if (lastHandledCompletedIdRef.current === completed.id) return;
    lastHandledCompletedIdRef.current = completed.id;

    setGeneratedVideoId(completed.id);
    setStatus("completado");
  }, [videos]);

  // Carga inicial del usuario y videos
  useEffect(() => {
    const fetchUser = async () => {
      const token = await getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setLoadingUser(false);
        return;
      }

      setIsAuthenticated(true);
      setLoadingUser(true);
      setError(null);

      const [userResponse] = await Promise.all([
        getCurrentUser(token),
      ]);

      setLoadingUser(false);

      if (userResponse.error) {
        setError(userResponse.error);
        if (userResponse.error.toLowerCase().includes("token")) {
          clearAuthToken();
          setIsAuthenticated(false);
        }
        return;
      }

      const anyUserResponse = userResponse as unknown as {
        usuario?: { tokens?: number | null };
      };

      if (anyUserResponse.usuario) {
        setTokens(anyUserResponse.usuario.tokens ?? null);
      }

      await loadVideos(token);
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión en Supabase:", error);
    } finally {
      clearAuthToken();
      // Mantener al usuario en la raíz y volver a mostrar el overlay de Google
      window.location.href = "/";
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const getStatusBadge = (statusValue: string) => {
    const normalized = statusValue.toLowerCase();
    if (normalized.includes("pendiente"))
      return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20";
    if (
      normalized.includes("completado") ||
      normalized.includes("completada") ||
      normalized === "success"
    )
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
    if (normalized.includes("error"))
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    return "bg-slate-500/15 text-slate-300 border border-slate-500/20";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const token = await getAuthToken();
    if (!token) {
      setError("No se encontró el token de autenticación. Inicia sesión de nuevo.");
      setIsAuthenticated(false);
      return;
    }

    if (!prompt.trim()) {
      setError("El prompt no puede estar vacío.");
      return;
    }

    if (typeof tokens === "number" && tokens < selectedModelTokenCost) {
      setError(
        `No tienes tokens suficientes para este modelo (${selectedModelTokenCost}). Tienes ${tokens}.`
      );
      return;
    }

    setLoading(true);
    setStatus("cociendo");
    setGeneratedVideoId(null);

    try {
      console.log("🚀 Enviando petición para crear video...", { prompt, duracion, ratio, selectedModel });
      const response = await createVideo(token, {
        prompt,
        duracion,
        aspect_ratio: ratio,
        model_type: selectedModel as any,
      });

      setLoading(false);

      if (response.error) {
        console.error("❌ Error de respuesta del servidor al crear video:", response.error);
        setStatus("error");
        setError(response.error);
        return;
      }

      const anyResponse = response as unknown as {
        video?: { id: number };
        tokensRestantes?: number;
      };

      if (!anyResponse.video) {
        setStatus("error");
        setError("Ocurrió un error inesperado al generar el video.");
        return;
      }

      if (typeof anyResponse.tokensRestantes === "number") {
        setTokens(anyResponse.tokensRestantes);
      }

      setPrompt("");
      setSuccess("Video iniciado correctamente. Se está procesando en segundo plano.");
      await loadVideos(token);
    } catch (err) {
      console.error("❌ Excepción capturada en la petición:", err);
      setLoading(false);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Ocurrió un error de red al generar el video.");
    }
  };

  const streamUrl = generatedVideoId ? `${STREAM_PROXY_BASE}/${generatedVideoId}` : null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#05070f] text-white">
      {/* Glows ambientales sutiles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <aside
        className={`relative z-10 flex w-72 shrink-0 flex-col border-r border-slate-800/80 bg-[#0a0d16]/90 px-5 py-6 backdrop-blur-xl transition-opacity duration-700 ${
          !isAuthenticated ? "opacity-40" : "opacity-100"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_40px_rgba(59,130,246,0.5)]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Stone Studio</p>
            <p className="text-xs text-zinc-500">Video Generator</p>
          </div>
        </div>

        {/* Tarjeta de Tokens destacada */}
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-[#141019] to-[#0d0b12] p-4 shadow-[0_0_45px_rgba(245,158,11,0.12)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(245,158,11,0.18),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300">
              <Coins className="h-3.5 w-3.5" /> Tokens
            </p>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/20">
              Saldo
            </span>
          </div>
          <div className="relative mt-3 flex items-end gap-2">
            <p className="text-4xl font-bold tracking-tight text-white">
              {loadingUser
                ? "..."
                : !isAuthenticated
                ? 250
                : tokens !== null
                ? tokens
                : "--"}
            </p>
            <p className="pb-1 text-sm text-zinc-400">tokens</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="relative mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-orange-500/20 transition hover:brightness-110"
          >
            Ver Planes de Tokens
          </button>
        </div>

        {/* Navegación */}
        <nav className="mt-6 space-y-1.5">
          <a
            href="#"
            className="flex items-center gap-3 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 shadow-[0_0_25px_rgba(59,130,246,0.15)]"
            onClick={(e) => e.preventDefault()}
          >
            <Sparkles className="h-4 w-4 text-blue-300" />
            Generar
          </a>
          <a
            href="#historial"
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("historial")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <History className="h-4 w-4 text-zinc-400" />
            Historial
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-zinc-300 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 text-zinc-400" />
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <main
        className={`relative z-10 flex-1 overflow-y-auto transition-opacity duration-700 ${
          !isAuthenticated ? "opacity-40" : "opacity-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Encabezado */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" /> Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
              Generá videos con IA
            </h1>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            {/* Panel Izquierdo: Formulario */}
            <section className="rounded-[2rem] border border-slate-800/80 bg-white/[0.03] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <h2 className="text-xl font-bold tracking-tight text-white">Configura tu generación</h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Describe el video que querés generar..."
                    className="min-h-[150px] w-full resize-none rounded-2xl border border-slate-800 bg-[#0b0e17] px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Selector de Modelo */}
                <div className="rounded-2xl border border-slate-800 bg-[#0b0e17] p-4">
                  <label className="mb-3 block text-sm font-medium text-zinc-300">Modelo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { key: "cheap", label: "Low", tokens: 1, dur: 5, icon: Zap },
                        { key: "normal", label: "Medium", tokens: 6, dur: 5, icon: Sparkles },
                        { key: "full", label: "Full", tokens: 10, dur: 5, icon: Gem },
                        { key: "premium", label: "High", tokens: 16, dur: 5, icon: Crown },
                      ] as const
                    ).map((m) => {
                      const Icon = m.icon;
                      const active = selectedModel === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.key);
                            setDuracion(m.dur);
                          }}
                          className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all duration-200 ${
                            active
                              ? "border-blue-400/50 bg-blue-500/15 shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                              : "border-slate-800 bg-[#0b0e17] hover:border-slate-700"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                              active
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-white/5 text-zinc-400 group-hover:text-zinc-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-semibold text-white">{m.label}</span>
                          <span
                            className={`text-[11px] font-medium ${
                              active ? "text-blue-300" : "text-zinc-500"
                            }`}
                          >
                            {m.tokens} T
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Aspect Ratio */}
                <div className="rounded-2xl border border-slate-800 bg-[#0b0e17] p-4">
                  <label className="mb-3 block text-sm font-medium text-zinc-300">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { r: "16:9", label: "Horizontal", icon: Monitor },
                      { r: "9:16", label: "Vertical", icon: Smartphone },
                      { r: "1:1", label: "Cuadrado", icon: Square },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = ratio === item.r;
                      return (
                        <button
                          key={item.r}
                          type="button"
                          onClick={() => setRatio(item.r as AspectRatio)}
                          className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition-all duration-200 ${
                            active
                              ? "border-blue-400/50 bg-blue-500/15 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                              : "border-slate-800 bg-white/[0.03] text-zinc-400 hover:border-slate-700 hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                          <span className={`text-[10px] ${active ? "text-blue-300" : "text-zinc-500"}`}>
                            {item.r}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {error}
                  </div>
                ) : null}

                {success && status !== "cociendo" && status !== "completado" ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canGenerate}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                >
                  {status === "cociendo" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cocinando...
                    </>
                  ) : (
                    "Generar Video"
                  )}
                </button>
              </form>
            </section>

            {/* Panel Derecho: Visualización e Historial */}
            <section className="rounded-[2rem] border border-slate-800/80 bg-white/[0.03] p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold tracking-tight text-white">Tu video</h2>

              <div className="mt-5">
                {status === "cociendo" ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-8 text-center text-blue-100 animate-pulse">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>🚀 Stone está cocinando tu video... Seguí el estado abajo en el historial.</p>
                  </div>
                ) : status === "completado" && generatedVideoId ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0e17] p-2 shadow-[0_0_60px_rgba(59,130,246,0.08)]">
                    <div className="overflow-hidden rounded-2xl bg-black">
                      <video
                        key={generatedVideoId}
                        controls
                        className="w-full rounded-2xl"
                        src={streamUrl ?? undefined}
                      />
                    </div>
                    <div className="mt-4 p-2">
                      <a
                        href={streamUrl ?? undefined}
                        download={`video-${generatedVideoId}.mp4`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                      >
                        <Download className="h-4 w-4" />
                        Descargar video
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-700/60 bg-[#0b0e17] p-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-white/10">
                      <Film className="h-7 w-7 text-blue-300/70" />
                    </div>
                    <p className="max-w-sm text-sm text-zinc-500">
                      Todavía no seleccionaste un video del historial para reproducir.
                    </p>
                  </div>
                )}
              </div>

              {/* HISTORIAL */}
              <div id="historial" className="mt-8">
                <h3 className="text-lg font-semibold tracking-tight text-white">Historial de videos</h3>

                {videoError ? (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    ⚠️ Error al obtener los videos: {videoError}
                  </div>
                ) : null}

                <div className="mt-4">
                  {loadingVideos && !isAuthenticated ? (
                    <div className="text-sm text-zinc-400">Cargando creaciones...</div>
                  ) : !isAuthenticated ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {DUMMY_VIDEOS.map((video) => (
                        <div
                          key={video.id}
                          className="rounded-2xl border border-slate-800 bg-[#0b0e17] p-4 transition hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-zinc-500">{formatDate(video.createdAt)}</p>
                              <h4 className="mt-1 max-w-[180px] truncate text-sm font-medium text-white">
                                {video.temaOriginal}
                              </h4>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusBadge(video.estado)}`}>
                              {video.estado}
                            </span>
                          </div>
                          {String(video.estado).toUpperCase() === "COMPLETADO" && video.urlVideo ? (
                            <span className="mt-3 block w-full rounded-xl bg-white/5 py-1.5 text-center text-xs font-semibold text-white/70">
                              Ver video
                            </span>
                          ) : (
                            <span className="mt-3 block rounded-xl bg-white/5 py-1 text-center text-[11px] text-zinc-500">
                              En progreso / Sin URL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : loadingVideos ? (
                    <div className="text-sm text-zinc-400">Cargando creaciones...</div>
                  ) : videos.length === 0 ? (
                    <div className="text-sm text-zinc-500">Aún no generaste ningún video.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="rounded-2xl border border-slate-800 bg-[#0b0e17] p-4 transition hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-zinc-500">{formatDate(video.createdAt)}</p>
                              <h4 className="mt-1 max-w-[180px] truncate text-sm font-medium text-white">
                                {video.temaOriginal}
                              </h4>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusBadge(video.estado)}`}>
                              {video.estado}
                            </span>
                          </div>

                          {String(video.estado).toUpperCase() === "COMPLETADO" && video.urlVideo ? (
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedVideoId(video.id);
                                setStatus("completado");
                              }}
                              className="mt-3 w-full rounded-xl bg-white/5 py-1.5 text-xs font-semibold transition hover:bg-white/10"
                            >
                              Ver video
                            </button>
                          ) : (
                            <span className="mt-3 block rounded-xl bg-white/5 py-1 text-center text-[11px] text-zinc-500">
                              En progreso / Sin URL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="mt-12 border-t border-slate-800/80 pt-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-zinc-500">
                &copy; 2026 Stone Studio. Todos los derechos reservados.
              </p>
              
              <a
                href="mailto:support@stonestudio.cc"
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                support@stonestudio.cc
              </a>

              <div className="flex gap-6">
                <Link
                  href="/terms"
                  className="text-sm text-zinc-500 transition hover:text-white"
                >
                  Términos y Condiciones
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-zinc-500 transition hover:text-white"
                >
                  Política de Privacidad
                </Link>
                <Link
                  href="/refunds"
                  className="text-sm text-zinc-500 transition hover:text-white"
                >
                  Política de Reembolsos
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* OVERLAY DE LOGIN - Solo visible si el usuario NO está autenticado */}
{!isAuthenticated && !loadingUser ? (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 p-4">
    <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0d16]/95 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/30 blur-[100px]" />

      <div className="relative space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Bienvenido a Stone Studio
          </h2>
          <p className="text-sm text-zinc-400">
            Inicia sesión con tu cuenta para acceder al generador y gestionar tus créditos.
          </p>
        </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              ) : null}

              {/* Botón único de acceso */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 px-5 py-3.5 text-sm font-semibold text-black shadow-lg shadow-blue-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirigiendo...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
