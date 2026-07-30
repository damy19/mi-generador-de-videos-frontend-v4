"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-14">
          <div className="mb-10 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Política de Privacidad
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Última actualización: 1 de julio de 2025
            </p>
          </div>

          <div className="space-y-6 text-sm leading-7 text-zinc-300">
            <p>
              En <strong className="text-white">StoneStudio</strong> valoramos tu
              privacidad. Esta Política de Privacidad describe cómo recopilamos,
              usamos y protegemos tu información personal cuando utilizas nuestra
              plataforma de generación de videos con inteligencia artificial.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              1. Información que Recopilamos
            </h2>
            <p>
              Recopilamos la siguiente información cuando utilizas el Servicio:
              nombre, dirección de correo electrónico (a través de autenticación
              con Google), datos de facturación procesados por nuestro proveedor
              de pagos, y metadatos sobre los videos generados (como duración,
              resolución y fecha de creación). No almacenamos los videos
              generados más allá del tiempo necesario para su entrega.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              2. Uso de la Información
            </h2>
            <p>
              Utilizamos tu información para: proporcionar y mejorar el Servicio,
              procesar pagos y gestionar tu suscripción, comunicarnos contigo
              sobre actualizaciones o cambios importantes, y cumplir con
              obligaciones legales y regulatorias.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              3. Compartición de Datos
            </h2>
            <p>
              No vendemos tu información personal a terceros. Compartimos datos
              únicamente con proveedores de servicios esenciales para el
              funcionamiento de la plataforma (procesamiento de pagos,
              autenticación, infraestructura en la nube), quienes están
              contractualmente obligados a proteger tu información.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              4. Seguridad
            </h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas
              adecuadas para proteger tu información contra acceso no autorizado,
              alteración, divulgación o destrucción. Sin embargo, ningún método de
              transmisión por internet o almacenamiento electrónico es 100 %
              seguro.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              5. Tus Derechos
            </h2>
            <p>
              Tienes derecho a acceder, corregir o eliminar tu información
              personal en cualquier momento desde la configuración de tu cuenta.
              También puedes solicitar la exportación de tus datos contactándonos
              directamente.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              6. Cookies
            </h2>
            <p>
              Utilizamos cookies esenciales para el funcionamiento del Servicio y
              cookies analíticas para entender cómo se usa la plataforma. Puedes
              gestionar tus preferencias de cookies desde la configuración de tu
              navegador.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              7. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre esta Política de Privacidad, no dudes en
              contactarnos a través de nuestros canales oficiales.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

