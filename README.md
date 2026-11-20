# Stone Studio · Frontend

Interfaz web de **Stone Studio**, una plataforma SaaS para generar videos con inteligencia artificial a partir de un texto.

- 🌐 Producto online: [stonestudio.cc](https://www.stonestudio.cc)
- ⚙️ Backend (API): [mi-generador-de-videos-backend-v4](https://github.com/damy19/mi-generador-de-videos-backend-v4)

## Funcionalidades

- **Landing y generador en una sola página.** El visitante ve la presentación del producto y, al iniciar sesión, accede al panel de generación.
- **Login con Google** mediante Supabase OAuth. La ruta `/auth/callback` intercambia el código por la sesión y la guarda en cookies con `@supabase/ssr`.
- **Panel de generación.** El usuario escribe un prompt y elige entre 4 niveles de calidad (cada uno muestra su costo en tokens) y el formato 16:9, 9:16 o 1:1.
- **Seguimiento del video.** El panel consulta el estado de la generación cada 5 segundos y muestra el reproductor cuando el video está listo.
- **Historial de videos** con su estado: pendiente, procesando, completado o error.
- **Compra de tokens con Paddle Checkout** en modo overlay. El ID del usuario viaja en `customData` para que el backend acredite la compra al recibir el webhook.
- **Páginas legales:** términos, privacidad y reembolsos.

## Stack

| Área | Tecnologías |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4, lucide-react |
| Autenticación | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), Google OAuth |
| Pagos | Paddle.js (`@paddle/paddle-js`) |

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Landing + panel de generación e historial
│   ├── auth/callback/        # Intercambio del código OAuth por la sesión
│   ├── login/                # Inicio de sesión con Google
│   ├── dashboard/tokens/     # Compra de tokens con Paddle
│   ├── pricing/              # Planes y precios
│   └── terms/ · privacy/ · refunds/   # Páginas legales
├── lib/
│   ├── api.ts                # Cliente de la API del backend
│   ├── auth.ts               # Token de sesión de Supabase
│   ├── paddle.ts             # Inicialización de Paddle.js y checkout
│   └── supabaseClient.ts     # Cliente de Supabase para el navegador
└── middleware.ts             # Redirecciones de rutas
```

## Cómo correrlo localmente

Necesitás Node.js 20 o superior y el [backend](https://github.com/damy19/mi-generador-de-videos-backend-v4) corriendo (por defecto en el puerto 3000).

```bash
git clone https://github.com/damy19/mi-generador-de-videos-frontend-v4.git
cd mi-generador-de-videos-frontend-v4
npm install
cp .env.example .env.local   # completá las variables
npm run dev -- -p 3001       # http://localhost:3001 (el 3000 lo usa el backend)
```

Las variables necesarias están explicadas en [`.env.example`](.env.example).

## Autor

**Damian Muni** · Desarrollador Full Stack · [LinkedIn](https://www.linkedin.com/in/damian-muni-aa0600179/)
