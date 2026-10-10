// Encabezado de página reutilizable (Validador, Emisor, Instituciones).
export default function PageHeader({ badge, title, highlight, subtitle }) {
  return (
    <div className="text-center space-y-4 max-w-3xl mx-auto">
      {badge && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-300 text-xs font-bold tracking-wide uppercase">
          {badge}
        </div>
      )}
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
        {title}{' '}
        {highlight && <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">{highlight}</span>}
      </h1>
      {subtitle && <p className="text-slate-600 dark:text-slate-300 text-base sm:text-xl">{subtitle}</p>}
    </div>
  );
}
