"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-14">
          <div className="mb-10 text-center">
            <p className="inline-block rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm uppercase tracking-[0.2em] text-blue-300">
              Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
              Términos de Servicio
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Última actualización: 1 de julio de 2025
            </p>
          </div>

          <div className="space-y-6 text-sm leading-7 text-zinc-300">
            <p>
              Bienvenido a <strong className="text-white">StoneStudio</strong>. Al
              acceder o utilizar nuestra plataforma de generación de videos con
              inteligencia artificial (en adelante, el &ldquo;Servicio&rdquo;),
              aceptas estar sujeto a los presentes Términos de Servicio. Si no
              estás de acuerdo con alguna parte, no debes utilizar el Servicio.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              1. Uso del Servicio
            </h2>
            <p>
              StoneStudio te otorga una licencia limitada, no exclusiva e
              intransferible para acceder y usar el Servicio de acuerdo con estos
              términos. Eres responsable de mantener la confidencialidad de tu
              cuenta y de todas las actividades que ocurran bajo ella.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              2. Planes y Facturación
            </h2>
            <p>
              El Servicio se ofrece bajo distintos planes de suscripción (Starter,
              Creator, Pro, Business) con límites de videos mensuales asociados.
              El pago se procesa a través de nuestro proveedor de pagos
              (Lemon Squeezy). Los precios y beneficios están detallados en
              nuestra página de precios y pueden ser modificados con aviso previo.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              3. Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido generado a través del Servicio te pertenece, siempre
              que no infrinja derechos de terceros. Queda prohibido utilizar la
              plataforma para generar material ilegal, difamatorio, obsceno o que
              viole cualquier ley aplicable.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              4. Limitación de Responsabilidad
            </h2>
            <p>
              StoneStudio no será responsable por daños indirectos, incidentales o
              consecuentes derivados del uso o la imposibilidad de usar el
              Servicio. El Servicio se proporciona &ldquo;tal cual&rdquo; sin
              garantías de ningún tipo, ya sean expresas o implícitas.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              5. Cancelación
            </h2>
            <p>
              Puedes cancelar tu suscripción en cualquier momento desde tu panel de
              control. La cancelación será efectiva al final del período de
              facturación actual. No se realizarán reembolsos parciales por días no
              utilizados, según lo detallado en nuestra Política de Reembolsos.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              6. Modificaciones
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier
              momento. Te notificaremos sobre cambios significativos a través del
              correo electrónico asociado a tu cuenta o mediante un aviso en la
              plataforma.
            </p>

            <h2 className="mt-8 text-lg font-semibold text-white">
              7. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre estos Términos de Servicio, puedes
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

