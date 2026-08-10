"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";
import { openPaddleCheckout } from "@/lib/paddle";

interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  pricePerToken: string;
  priceId: string;
  isPopular?: boolean; // Para destacar el pack estrella como el plan "Pro"
}

export default function TokensPage() {
  const router = useRouter();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const tokenPacks: TokenPack[] = [
    {
      id: "pack_starter",
      name: "Starter Pack",
      tokens: 40,
      price: 8,
      pricePerToken: "$0.20",
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || "",
    },
    {
      id: "pack_creator",
      name: "Creator Pack",
      tokens: 120,
      price: 18,
      pricePerToken: "$0.15",
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_CREATOR || "",
    },
    {
      id: "pack_pro",
      name: "Pro Pack",
      tokens: 300,
      price: 36,
      pricePerToken: "$0.12",
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || "",
      isPopular: true, // Este va a tener el diseño brillante y el botón degradado naranja/rosa
    },
    {
      id: "pack_business",
      name: "Business Pack",
      tokens: 800,
      price: 80,
      pricePerToken: "$0.10",
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS || "",
    },
  ];

  const handlePurchase = async (pack: TokenPack) => {
    try {
      if (!pack.priceId) {
        throw new Error(
          `Falta configurar el Price ID del pack ${pack.name} en frontend/.env.local.`
        );
      }

      const token = await getAuthToken();
      if (!token) {
        router.push("/");
        return;
      }

      setLoadingPack(pack.id);

      // Necesitamos el id del usuario (de Prisma) para acreditarlo en el webhook.
      const userResponse = await getCurrentUser(token);
      if (userResponse.error) {
        throw new Error(userResponse.error || "No se pudo obtener el usuario.");
      }

      const anyUser = userResponse as unknown as {
        usuario?: { id?: number | string | null };
      };
      const userId = anyUser.usuario?.id ?? null;

      await openPaddleCheckout({
        priceId: pack.priceId,
        userId,
        successUrl: `${window.location.origin}/`,
      });
    } catch (err) {
      console.error("handlePurchase error:", err);
      alert(
        err instanceof Error ? err.message : "Ocurrió un error al abrir el checkout."
      );
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-white flex flex-col justify-center px-6 py-16">
      <div className="mx-auto max-w-6xl w-full space-y-12">
        
        {/* Encabezado idéntico al de Suscripción */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-blue-400 uppercase">
            Cargar Crédito
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Comprar Packs de Tokens
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto text-sm sm:text-base">
            ¿Te quedaste corto? Sumá tokens extra al instante sin perder tu suscripción actual.
          </p>
        </div>

        {/* Grilla de Tarjetas con diseño calcado de /pricing */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
          {tokenPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative flex flex-col justify-between rounded-[2rem] border p-8 transition-all duration-300 ${
                pack.isPopular
                  ? "border-amber-500/30 bg-[#0d0f14] shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                  : "border-white/5 bg-[#0d0f14] hover:border-white/10"
              }`}
            >
              {/* Badge dorado para el pack Pro destacado */}
              {pack.isPopular && (
                <span className="absolute -top-3 right-6 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                  Más Popular
                </span>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">{pack.name}</h3>
                
                {/* Precio en grande */}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    ${pack.price}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">/ pack</span>
                </div>

                {/* Lista de características con las tildes verdes redondeadas */}
                <ul className="space-y-3 pt-4 border-t border-white/5">
                  <li className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="font-semibold text-white">{pack.tokens} videos / tokens</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Sin vencimiento</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{pack.pricePerToken} por token</span>
                  </li>
                </ul>
              </div>

              {/* Botones idénticos a los del Pricing */}
              <button
                onClick={() => handlePurchase(pack)}
                disabled={loadingPack !== null}
                className={`mt-8 w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                  pack.isPopular
                    ? "bg-gradient-to-r from-amber-500 to-red-500 text-white font-bold hover:brightness-110 shadow-lg shadow-orange-500/20"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {loadingPack === pack.id ? "Abriendo checkout..." : `Comprar ${pack.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Botón sutil para volver atrás */}
        <div className="text-center pt-8">
<a
            href="/"
            className="inline-block text-sm text-zinc-500 hover:text-white transition underline underline-offset-4"
          >
            Volver al Inicio
          </a>
        </div>

      </div>
    </div>
  );
}

