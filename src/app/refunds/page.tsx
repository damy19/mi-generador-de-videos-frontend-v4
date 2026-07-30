"use client";

import Link from "next/link";

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-14">
          <div className="mb-10 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Política de Reembolsos
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Última actualización: 1 de julio de 2025
            </p>
          </div>

          <div className="space-y-6 text-sm leading-7 text-zinc-300">
            <p>
              En <strong className="text-white">StoneStudio</strong> queremos que
              estés completamente satisfecho con nuestro servicio de generación
              de videos con inteligencia artificial. A continuación, detallamos
              nuestra política de reembolsos.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              1. Suscripciones Mensuales
            </h2>
            <p>
              Las suscripciones mensuales se facturan por adelantado al inicio de
              cada período. Debido a la naturaleza digital e instantánea del
              servicio (los videos se generan y entregan de inmediato), no
              ofrecemos reembolsos parciales ni prorrateos por días no utilizados
              dentro de un período de facturación activo.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              2. Cancelación
            </h2>
            <p>
              Puedes cancelar tu suscripción en cualquier momento desde tu panel
              de control. Al cancelar, tu suscripción permanecerá activa hasta el
              final del período de facturación actual. No se realizarán cargos
              adicionales después de la cancelación.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              3. Excepciones
            </h2>
            <p>
              Evaluaremos solicitudes de reembolso en casos excepcionales, como
              fallos técnicos recurrentes que impidan el uso del servicio durante
              un período prolongado. Estas solicitudes se revisarán caso por caso
              y deben enviarse dentro de los 7 días posteriores al cargo.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              4. Compras Únicas (Custom Packs)
            </h2>
            <p>
              Los paquetes de videos adicionales (custom packs) son compras
              únicas no recurrentes. Una vez entregados, no son reembolsables
              debido a la naturaleza digital del producto.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              5. Cómo Solicitar un Reembolso
            </h2>
            <p>
              Para solicitar un reembolso, contáctanos a través de nuestros
              canales oficiales dentro de los 7 días posteriores a la
              transacción. Incluye tu correo electrónico registrado y el motivo
              de la solicitud. Procesaremos tu solicitud en un plazo máximo de
              10 días hábiles.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              6. Cambios en esta Política
            </h2>
            <p>
              Nos reservamos el derecho de modificar esta Política de Reembolsos
              en cualquier momento. Los cambios entrarán en vigor a partir de su
              publicación en esta página.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              7. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre esta Política de Reembolsos, no dudes en
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

