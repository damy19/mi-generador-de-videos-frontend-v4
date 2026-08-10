import { initializePaddle, Paddle, Environments } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";

// Si el token empieza con "test_" estamos en sandbox de Paddle.
export const PADDLE_ENVIRONMENT: Environments = CLIENT_TOKEN.startsWith("test_")
  ? "sandbox"
  : "production";

/**
 * Inicializa Paddle.js una sola vez y devuelve la instancia.
 * @paddle/paddle-js descarga Paddle.js desde el CDN de Paddle.
 */
export const getPaddle = async (): Promise<Paddle | undefined> => {
  if (paddleInstance) return paddleInstance;
  if (!CLIENT_TOKEN) return undefined;

  paddleInstance = await initializePaddle({
    environment: PADDLE_ENVIRONMENT,
    token: CLIENT_TOKEN,
  });

  return paddleInstance;
};

export type OpenPaddleCheckoutParams = {
  priceId: string;
  userId?: number | string | null;
  successUrl?: string;
  customData?: Record<string, unknown>;
};

/**
 * Abre el checkout de Paddle en overlay (client-side).
 * Envía el userId del usuario en customData para acreditarlo en el webhook.
 */
export const openPaddleCheckout = async (params: OpenPaddleCheckoutParams) => {
  const paddle = await getPaddle();

  if (!paddle) {
    throw new Error(
      "No se pudo inicializar Paddle.js. Verificá NEXT_PUBLIC_PADDLE_CLIENT_TOKEN en frontend/.env.local."
    );
  }

  paddle.Checkout.open({
    items: [{ priceId: params.priceId, quantity: 1 }],
    customData: {
      ...(params.userId != null ? { user_id: String(params.userId) } : {}),
      ...(params.customData || {}),
    },
    settings: {
      ...(params.successUrl ? { successUrl: params.successUrl } : {}),
      displayMode: "overlay",
      theme: "dark",
      locale: "es",
    },
  });
};

