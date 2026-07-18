export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type AuthPayload = {
  nombre?: string;
  email: string;
  password: string;
};

type AspectRatio = "16:9" | "9:16" | "1:1";

type ModelType = "cheap" | "normal" | "premium";

type CreateVideoPayload = {
  prompt: string;
  duracion: number;
  aspect_ratio?: AspectRatio;
  model_type?: ModelType;
};



type ApiResponse<T> = {
  mensaje?: string;
  token?: string;
  usuario?: T;
  videos?: T;
  error?: string;
  creditosRestantes?: number;
  tokensRestantes?: number;
};

const postJson = async <T>(url: string, data: unknown): Promise<ApiResponse<T>> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const payload = await response.json();

  if (!response.ok) {
    return {
      error: payload.error || "Error en la petición",
    };
  }

  return payload;
};

const fetchJsonWithAuth = async <T>(url: string, token: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    return {
      error: payload.error || "Error en la petición",
    };
  }

  return payload as ApiResponse<T>;
};

export const registerUser = async (payload: AuthPayload) => {
  return postJson<{ id: number; nombre: string; email: string; creditos: number }>(
    `${API_BASE_URL}/api/auth/signup`,
    payload
  );
};

export const loginUser = async (payload: AuthPayload) => {
  return postJson<{ id: number; nombre: string; email: string; creditos: number }>(
    `${API_BASE_URL}/api/auth/login`,
    payload
  );
};

export const getCurrentUser = async (token: string) => {
  return fetchJsonWithAuth<{ id: number; nombre: string; email: string; creditos: number; tokens: number }>(
    `${API_BASE_URL}/api/auth/me`,
    token
  );
};

export const createVideo = async (token: string, payload: CreateVideoPayload) => {
  return fetchJsonWithAuth<{ video: { id: number; userId: number; temaOriginal: string; duracion: number; estado: string; createdAt: string }; creditosRestantes?: number; tokensRestantes?: number }>(
    `${API_BASE_URL}/api/videos/crear`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};

export const getMyVideos = async (token: string) => {
  return fetchJsonWithAuth<Array<{ id: number; temaOriginal: string; duracion: number; urlVideo: string | null; estado: string; createdAt: string }>>(
    `${API_BASE_URL}/api/videos/mis-videos`,
    token
  );
};
