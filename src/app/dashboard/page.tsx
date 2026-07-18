"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { clearAuthToken, getAuthToken } from "../../lib/auth";
import { API_BASE_URL, createVideo, getCurrentUser, getMyVideos } from "../../lib/api";
import { supabase } from "../../lib/supabaseClient";

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
  normal: 5, // Corregido de 6 a 5 para que coincida con tu UI gráfica
  full: 10,
  premium: 16,
};

const STREAM_PROXY_BASE = `${BACKEND_BASE_URL}/api/videos/stream`;

export default function DashboardPage() {
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

  // Separamos los errores para que el del historial no congele la creación de videos
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const lastHandledCompletedIdRef = useRef<number | null>(null);

  const hasActiveGeneration = videos.some((v) => {
    const estado = String(v.estado || "").toUpperCase();
    return ["PENDIENTE", "EN_COLA", "PROCESANDO", "EN_PROGRESO", "COMPLETANDO"].includes(estado);
  });

  // El botón ahora solo se bloquea si falta prompt, faltan tokens o ya está cargando
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
      return; // Silencioso en segundo plano para no molestar en la UI
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
        router.push("/login");
        return;
      }

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
          router.push("/login");
        }
        return;
      }

      const anyUserResponse = userResponse as unknown as {
        usuario?: { tokens?: number | null };
      };

      if (anyUserResponse.usuario) {
        setTokens(anyUserResponse.usuario.tokens ?? null);
      }

      // Cargamos los videos de manera independiente
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
      window.location.href = "/login";
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
      router.push("/login");
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
    <div className="flex h-screen w-full bg-[#05070f] text-white overflow-hidden">
      <aside className="w-72 border-r border-white/10 bg-white/5 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_60px_rgba(59,130,246,0.35)]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Stone Studio</p>
            <p className="text-xs text-zinc-400">Video Generator</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-[#111827] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Tokens</p>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-4xl font-semibold">{loadingUser ? "..." : tokens !== null ? tokens : "--"}</p>
            <p className="pb-1 text-sm text-zinc-400">tokens</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/pricing")}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-95"
          >
            Ver Planes de Tokens
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          <a href="#" className="block rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100" onClick={(e) => e.preventDefault()}>Generar</a>
          <a href="#historial" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("historial")?.scrollIntoView({ behavior: "smooth" });
            }}
          >Historial</a>
          <button type="button" onClick={handleLogout} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/10">
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div>
            <p className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Generá videos con IA</h1>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            {/* Panel Izquierdo: Formulario */}
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white">Configura tu generación</h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Describe el video que querés generar..."
                    className="min-h-[150px] w-full resize-none rounded-3xl border border-white/10 bg-[#111827] px-4 py-4 text-white outline-none transition focus:border-blue-400"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#111827] p-4">
                  <label className="mb-3 block text-sm font-medium text-zinc-300">Modelo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { key: "cheap", label: "Low", tokens: 1, dur: 5 },
                        { key: "normal", label: "Medium", tokens: 5, dur: 5 },
                        { key: "full", label: "Full", tokens: 10, dur: 5 },
                        { key: "premium", label: "High", tokens: 16, dur: 5 },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.key);
                          setDuracion(m.dur);
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition border ${
                          selectedModel === m.key ? "border-blue-400 bg-blue-500/20 text-blue-200" : "border-white/10 bg-[#111827]"
                        }`}
                      >
                        {m.label} ({m.tokens} T)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#111827] p-4">
                  <label className="mb-3 block text-sm font-medium text-zinc-300">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { r: "16:9", label: "Horizontal" },
                      { r: "9:16", label: "Vertical" },
                      { r: "1:1", label: "Cuadrado" },
                    ].map((item) => (
                      <button
                        key={item.r}
                        type="button"
                        onClick={() => setRatio(item.r as AspectRatio)}
                        className={`rounded-xl border p-2 text-xs font-semibold transition ${
                          ratio === item.r ? "border-blue-400 bg-blue-500/20 text-blue-200" : "border-white/10 bg-white/5"
                        }`}
                      >
                        {item.label} <span className="block opacity-60">{item.r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ERROR CRÍTICO DEL FORMULARIO */}
                {error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    {error}
                  </div>
                ) : null}

                {/* MENSAJE DE ÉXITO */}
                {success && status !== "cociendo" && status !== "completado" ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canGenerate}
                  className="w-full rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 py-4 text-sm font-semibold text-white shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === "cociendo" ? "Cocinando..." : "Generar Video"}
                </button>
              </form>
            </section>

            {/* Panel Derecho: Visualización e Historial */}
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white">Tu video</h2>
              
              <div className="mt-5">
                {status === "cociendo" ? (
                  <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-8 text-center text-blue-100 animate-pulse">
                    🚀 Stone está cocinando tu video... Seguí el estado abajo en el historial.
                  </div>
                ) : status === "completado" && generatedVideoId ? (
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827] p-4">
                    <video key={generatedVideoId} controls className="w-full rounded-2xl" src={streamUrl ?? undefined} />
                    <div className="mt-4">
                      <a href={streamUrl ?? undefined} download={`video-${generatedVideoId}.mp4`} className="block w-full text-center rounded-3xl bg-emerald-400 py-3 text-sm font-semibold text-black">
                        Descargar video
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center text-zinc-400">
                    Todavía no seleccionaste un video del historial para reproducir.
                  </div>
                )}
              </div>

              {/* HISTORIAL */}
              <div id="historial" className="mt-8">
                <h3 className="text-lg font-semibold text-white">Historial de videos</h3>
                
                {/* CARTEL ROJO AISLADO (Solo se muestra en el historial si falla) */}
                {videoError ? (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                    ⚠️ Error al obtener los videos: {videoError}
                  </div>
                ) : null}

                <div className="mt-4">
                  {loadingVideos ? (
                    <div className="text-zinc-400 text-sm">Cargando creaciones...</div>
                  ) : videos.length === 0 ? (
                    <div className="text-zinc-500 text-sm">Aún no generaste ningún video.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {videos.map((video) => (
                        <div key={video.id} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-zinc-500">{formatDate(video.createdAt)}</p>
                              <h4 className="mt-1 text-sm font-medium text-white truncate max-w-[180px]">{video.temaOriginal}</h4>
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
                              className="mt-3 w-full rounded-xl bg-white/5 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
                            >
                              Ver video
                            </button>
                          ) : (
                            <span className="block mt-3 text-center text-[11px] text-zinc-500 bg-white/5 py-1 rounded-xl">
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
        </div>
      </main>
    </div>
  );
}