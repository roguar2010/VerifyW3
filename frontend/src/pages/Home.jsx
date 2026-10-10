import { Link } from 'react-router-dom';

const METRICS = [
  { value: '< 60 seg', label: 'Validación total', color: 'text-cyan-500' },
  { value: '100%', label: 'Privacidad off-chain', color: 'text-emerald-500' },
  { value: '3–5 seg', label: 'Finalidad en Stellar', color: 'text-violet-500' },
  { value: '< $0.0001', label: 'Costo de red estimado', color: 'text-cyan-500' },
];

// Flujo de usuario del Product Blueprint (sección 3)
const STEPS = [
  { n: 1, role: 'Emisor', text: 'Registra la huella del certificado con su firma institucional.', to: '/emisor' },
  { n: 2, role: 'Titular', text: 'Adjunta el archivo en su postulación laboral.' },
  { n: 3, role: 'Verificador', text: 'Entra al portal público, sin cuenta ni billetera.', to: '/verificar' },
  { n: 4, role: 'Verificador', text: 'Arrastra el PDF o escribe el código de la credencial.' },
  { n: 5, role: 'Sistema', text: 'Calcula el hash en el navegador y consulta la red.' },
  { n: 6, role: 'Verificador', text: 'Ve el dictamen: Válido, Adulterado o Revocado, y quién emitió.' },
];

const ACTORS = [
  {
    icon: '💼',
    title: 'Empresas y RRHH',
    color: 'cyan',
    items: [
      'Validación instantánea durante la entrevista, sin esperar semanas.',
      'Detección de certificados adulterados o revocados.',
      'Verificación del emisor contra el directorio de instituciones acreditadas.',
    ],
  },
  {
    icon: '🏛️',
    title: 'Universidades y academias',
    color: 'emerald',
    items: [
      'Menos correspondencia y llamadas manuales a secretaría.',
      'Registro firmado con la llave institucional.',
      'Revocación de títulos en tiempo real, sin borrar el historial.',
    ],
  },
  {
    icon: '🎓',
    title: 'Egresados y titulares',
    color: 'violet',
    items: [
      'Su documento es verificable por cualquier empresa.',
      'Sus datos personales nunca viajan a la red: solo el hash.',
      'Evidencia que sobrevive aunque la institución cierre su portal.',
    ],
  },
];

// Clases completas (Tailwind no detecta nombres armados dinámicamente)
const ICON_BOX = {
  cyan: 'bg-cyan-100 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-700/60',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700/60',
  violet: 'bg-violet-100 dark:bg-violet-950/80 border-violet-300 dark:border-violet-700/60',
};
const CARD_HOVER = {
  cyan: 'hover:border-cyan-500',
  emerald: 'hover:border-emerald-500',
  violet: 'hover:border-violet-500',
};

export default function Home() {
  return (
    <div className="space-y-24 sm:space-y-28">
      {/* Hero */}
      <section className="text-center space-y-7 max-w-4xl mx-auto pt-4 sm:pt-12">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm font-bold tracking-wide uppercase">
          🛡️ Credenciales verificables sobre Stellar
        </div>
        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          La verdad de un título comprobada en{' '}
          <span className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 bg-clip-text text-transparent">segundos, no en semanas</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-2xl max-w-3xl mx-auto leading-relaxed">
          Reemplazamos las cartas membretadas por un registro inmutable y respetuoso con la privacidad del egresado.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <Link
            to="/verificar"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-cyan-500/25 transition hover:-translate-y-1"
          >
            ⚡ Verificar un documento
          </Link>
          <Link
            to="/emisor"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-base sm:text-lg transition"
          >
            🏛️ Soy una institución
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8 sm:pt-12 border-t border-slate-200 dark:border-slate-800/80">
          {METRICS.map((m) => (
            <div key={m.label} className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
              <span className={`text-2xl sm:text-4xl font-black block ${m.color}`}>{m.value}</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1 block">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Flujo del Blueprint */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">Así funciona VerifyW3</h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">El recorrido completo del MVP, de la emisión a la verificación.</p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <li key={s.n} className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-sm flex gap-4">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500 text-white dark:text-slate-950 font-black flex items-center justify-center">{s.n}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{s.role}</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">{s.text}</p>
                {s.to && (
                  <Link to={s.to} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Ir a esta pantalla →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Actores */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">Una solución para cada participante</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ACTORS.map((a) => (
            <div key={a.title} className={`bg-white/80 dark:bg-slate-900/80 border p-8 rounded-3xl space-y-4 hover:-translate-y-2 transition duration-300 shadow-md backdrop-blur-sm ${CARD_HOVER[a.color]} border-slate-200 dark:border-slate-800`}>
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl animate-float ${ICON_BOX[a.color]}`}>
                {a.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{a.title}</h3>
              <ul className="text-slate-600 dark:text-slate-400 text-sm sm:text-base space-y-3">
                {a.items.map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-cyan-500 font-bold">✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 rounded-3xl p-1 shadow-2xl">
        <div className="bg-slate-900/95 dark:bg-slate-950/90 rounded-[1.4rem] p-8 sm:p-14 text-center space-y-6">
          <h2 className="text-2xl sm:text-5xl font-black text-white">¿Quieres probarlo ahora?</h2>
          <p className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto">
            Usa los PDF de ejemplo incluidos para ver un título válido, uno adulterado, uno revocado y uno de un emisor no acreditado.
          </p>
          <Link to="/verificar" className="inline-block px-9 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-base sm:text-lg shadow-xl transition hover:scale-105">
            Ir al validador ➔
          </Link>
        </div>
      </section>
    </div>
  );
}
