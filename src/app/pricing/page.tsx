"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "../../lib/auth";
import { API_BASE_URL } from "../../lib/api";

const checkoutApi = `${API_BASE_URL}/api/checkout/custom-pack`;

type Plan = {
  name: string;

  price: number;
  checkoutUrl: string;
  variantId: number;
  features: string[];
  recommended?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: 8.0,
    checkoutUrl:
      "https://dmia.lemonsqueezy.com/checkout/buy/afea6f70-1b8a-42fb-b8c4-147a49f7c887",
    variantId: 1773938,
    features: ["40 videos al mes"],
  },
  {
    name: "Creator",
    price: 18.0,
    checkoutUrl:
      "https://dmia.lemonsqueezy.com/checkout/buy/6d450301-5fe8-4f1a-b18b-771d82219243",
    variantId: 1773941,
    features: ["120 videos al mes"],
  },
  {
    name: "Pro",
    price: 36.0,
    checkoutUrl:
      "https://dmia.lemonsqueezy.com/checkout/buy/d860402f-856d-4227-884f-6ca00973f7e8",
    variantId: 1773945,
    features: ["300 videos al mes"],
    recommended: true,
  },
  {
    name: "Business",
    price: 80.0,
    checkoutUrl:
      "https://dmia.lemonsqueezy.com/checkout/buy/72156fbe-306c-4d3f-8514-276016bf5008",
    variantId: 1773949,
    features: ["800 videos al mes"],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const handleBuy = async (plan: Plan) => {
    try {
      const token = await getAuthToken();
if (!token) {
        // Si no hay sesión de Supabase, pedimos login pero no intentamos crear el checkout.
        router.push("/");
        return;
      }

      setBuying(true);
      setSelectedVariantId(plan.variantId);

      const response = await fetch(checkoutApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variantId: plan.variantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear el checkout de pago.");
      }

      if (!data?.url) {
        throw new Error("No se recibió la URL del checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("handleBuy error:", err);
      alert(
        err instanceof Error ? err.message : "Ocurrió un error al crear el checkout."
      );
    } finally {
      setBuying(false);
    }
  };

  return (

    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="text-center">
          <p className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
            Suscripción
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Elegí tu plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-400">
            
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.variantId}
                className={
                  plan.recommended
                    ? "relative overflow-hidden rounded-[2rem] border border-amber-400/30 bg-white/5 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_100px_rgba(245,158,11,0.18)] backdrop-blur-xl"
                    : "relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                }
              >
                {plan.recommended ? (
                  <div className="absolute right-4 top-4">
                    <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Más Popular
                    </span>
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {plan.name}
                    </h2>
                    
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold">
                      ${plan.price.toFixed(0)}
                    </span>
                    <span className="pb-1 text-sm text-zinc-400">/ mes</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={`${plan.variantId}-f-${idx}`}
                      className="flex items-start gap-3 text-sm text-zinc-200"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
                        ✓
                      </span>
                      <span className="leading-6">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => handleBuy(plan)}
                    disabled={buying && selectedVariantId === plan.variantId}
                    className={
                      plan.recommended
                        ? "block w-full rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-5 py-3 text-center text-sm font-semibold text-black transition hover:opacity-95 disabled:opacity-60"
                        : "block w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                    }
                  >
                    {buying && selectedVariantId === plan.variantId
                      ? "Creando checkout..."
                      : `Contratar ${plan.name}`}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  );
}

